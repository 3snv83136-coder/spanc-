'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, Layer, Circle, Polyline, Polygon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import html2canvas from 'html2canvas'
import {
  CARTO_COLORS,
  DEFAULT_CARTO_STYLE,
  newElementId,
  type CartoCircle,
  type CartoElement,
  type CartoEquipment,
  type CartoLine,
  type CartoPlan,
  type CartoPolygon,
  type CartoText,
  type CartoTool,
  type LatLng,
  type LineStyle,
  type LineWeight,
} from '@/lib/types/cartographie'
import { EQUIPEMENTS_ANC, filterEquipements, findEquipement } from '@/lib/cartographie/equipements'
import { saveCartoPlan } from '@/lib/cartographie/storage'
import { boundsFromGeometry } from '@/lib/cartographie/geo'

interface Props {
  plan: CartoPlan
  onBack: () => void
}

type LayerMap = Map<string, Layer>

function dashArray(style: LineStyle): string | undefined {
  if (style === 'dashed') return '8 6'
  if (style === 'dotted') return '2 6'
  return undefined
}

function elementLabel(el: CartoElement): string {
  if (el.nom) return el.nom
  if (el.type === 'equipment') return findEquipement(el.equipmentId)?.label || 'Équipement'
  if (el.type === 'text') return el.text
  if (el.type === 'circle') return 'Cercle'
  if (el.type === 'line') return 'Ligne'
  return 'Polygone'
}

export default function CartographieEditor({ plan: initialPlan, onBack }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<LeafletMap | null>(null)
  const layersRef = useRef<LayerMap>(new Map())
  const parcelLayerRef = useRef<Layer | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  const [plan, setPlan] = useState<CartoPlan>(initialPlan)
  const [tool, setTool] = useState<CartoTool>('select')
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(EQUIPEMENTS_ANC[0].id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [draftPoints, setDraftPoints] = useState<LatLng[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle')
  const [showProps, setShowProps] = useState(true)
  const [showEquip, setShowEquip] = useState(true)

  const selected = plan.elements.find(e => e.id === selectedId) || null
  const filteredEquip = filterEquipements(search)

  const persist = useCallback((next: CartoPlan) => {
    setPlan(next)
    setSaveStatus('saving')
    saveCartoPlan(next)
    setTimeout(() => setSaveStatus('saved'), 300)
  }, [])

  const updateElements = useCallback((updater: (els: CartoElement[]) => CartoElement[]) => {
    setPlan(prev => {
      const next = { ...prev, elements: updater(prev.elements) }
      saveCartoPlan(next)
      setSaveStatus('saved')
      return next
    })
  }, [])

  // Init Leaflet
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!mapRef.current || mapInstance.current) return
      const L = await import('leaflet')
      if (cancelled) return
      LRef.current = L

      const map = L.map(mapRef.current, {
        center: [plan.center.lat, plan.center.lng],
        zoom: plan.zoom,
        zoomControl: true,
      })
      mapInstance.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 20,
      }).addTo(map)

      L.tileLayer.wms('https://data.geopf.fr/wms-v/ows', {
        layers: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
        format: 'image/png',
        transparent: true,
        attribution: '© IGN / DGFiP',
        maxZoom: 20,
      }).addTo(map)

      if (plan.parcelleGeometry) {
        const geoLayer = L.geoJSON(plan.parcelleGeometry as GeoJSON.GeoJsonObject, {
          style: { color: '#f97316', weight: 3, fillColor: '#f97316', fillOpacity: 0.08 },
        })
        geoLayer.addTo(map)
        parcelLayerRef.current = geoLayer
        const b = boundsFromGeometry(plan.parcelleGeometry)
        if (b) map.fitBounds(b, { padding: [40, 40], maxZoom: 19 })
      }
    }
    init()
    return () => {
      cancelled = true
      mapInstance.current?.remove()
      mapInstance.current = null
      layersRef.current.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync elements on map
  useEffect(() => {
    const map = mapInstance.current
    const L = LRef.current
    if (!map || !L) return

    layersRef.current.forEach(layer => layer.remove())
    layersRef.current.clear()

    for (const el of plan.elements) {
      let layer: Layer | null = null

      if (el.type === 'equipment') {
        const eq = findEquipement(el.equipmentId)
        const icon = L.divIcon({
          className: 'carto-equipment-icon',
          html: `<div style="background:#0e2a52;color:white;border:2px solid white;border-radius:12px;padding:4px 6px;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.3);transform:translate(-50%,-50%)">${eq?.icon || '📍'}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
        const marker = L.marker([el.position.lat, el.position.lng], { icon, draggable: tool === 'select' })
        marker.on('click', () => { setSelectedId(el.id); setTool('select') })
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          updateElements(els => els.map(e => e.id === el.id && e.type === 'equipment'
            ? { ...e, position: { lat: pos.lat, lng: pos.lng } }
            : e))
        })
        layer = marker
      }

      if (el.type === 'line') {
        const poly = L.polyline(el.points.map(p => [p.lat, p.lng] as [number, number]), {
          color: el.color,
          weight: el.weight,
          dashArray: dashArray(el.lineStyle),
        })
        poly.on('click', () => { setSelectedId(el.id); setTool('select') })
        layer = poly
      }

      if (el.type === 'polygon') {
        const poly = L.polygon(el.points.map(p => [p.lat, p.lng] as [number, number]), {
          color: el.color,
          weight: el.weight,
          dashArray: dashArray(el.lineStyle),
          fillColor: el.fillColor || el.color,
          fillOpacity: el.fillOpacity ?? 0.2,
        })
        poly.on('click', () => { setSelectedId(el.id); setTool('select') })
        layer = poly
      }

      if (el.type === 'circle') {
        const circle = L.circle([el.center.lat, el.center.lng], {
          radius: el.radiusM,
          color: el.color,
          weight: el.weight,
          dashArray: dashArray(el.lineStyle),
          fillColor: el.fillColor || el.color,
          fillOpacity: el.fillOpacity ?? 0.2,
        })
        circle.on('click', () => { setSelectedId(el.id); setTool('select') })
        layer = circle
      }

      if (el.type === 'text') {
        const icon = L.divIcon({
          className: 'carto-text-icon',
          html: `<div style="color:${el.color};font-size:${el.fontSize}px;font-weight:700;text-shadow:0 1px 2px white;white-space:nowrap;transform:translate(-50%,-50%)">${el.text}</div>`,
          iconAnchor: [0, 0],
        })
        const marker = L.marker([el.position.lat, el.position.lng], { icon, draggable: tool === 'select' })
        marker.on('click', () => { setSelectedId(el.id); setTool('select') })
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          updateElements(els => els.map(e => e.id === el.id && e.type === 'text'
            ? { ...e, position: { lat: pos.lat, lng: pos.lng } }
            : e))
        })
        layer = marker
      }

      if (layer) {
        layer.addTo(map)
        if (selectedId === el.id && 'setStyle' in layer) {
          (layer as Polyline | Polygon | Circle).setStyle?.({ weight: (el.type === 'equipment' || el.type === 'text') ? undefined : 4 })
        }
        layersRef.current.set(el.id, layer)
      }
    }

    // Draft preview
    if (draftPoints.length > 0) {
      if (tool === 'line') {
        const draft = L.polyline(draftPoints.map(p => [p.lat, p.lng] as [number, number]), {
          color: '#2563eb', weight: 2, dashArray: '6 4',
        })
        draft.addTo(map)
        layersRef.current.set('__draft__', draft)
      }
      if (tool === 'polygon' && draftPoints.length >= 2) {
        const draft = L.polygon(draftPoints.map(p => [p.lat, p.lng] as [number, number]), {
          color: '#2563eb', weight: 2, dashArray: '6 4', fillOpacity: 0.1,
        })
        draft.addTo(map)
        layersRef.current.set('__draft__', draft)
      }
    }
  }, [plan.elements, selectedId, tool, draftPoints, updateElements])

  // Map click handler
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    function onClick(e: { latlng: { lat: number; lng: number } }) {
      const pos = { lat: e.latlng.lat, lng: e.latlng.lng }

      if (tool === 'equipment') {
        const el: CartoEquipment = {
          id: newElementId(),
          type: 'equipment',
          equipmentId: selectedEquipmentId,
          position: pos,
          nom: findEquipement(selectedEquipmentId)?.label,
        }
        updateElements(els => [...els, el])
        setSelectedId(el.id)
        return
      }

      if (tool === 'line' || tool === 'polygon') {
        setDraftPoints(prev => [...prev, pos])
        return
      }

      if (tool === 'circle') {
        const el: CartoCircle = {
          id: newElementId(),
          type: 'circle',
          center: pos,
          radiusM: 6,
          nom: 'Zone',
          ...DEFAULT_CARTO_STYLE,
          fillColor: '#16a34a',
          color: '#16a34a',
        }
        updateElements(els => [...els, el])
        setSelectedId(el.id)
        setTool('select')
        return
      }

      if (tool === 'text') {
        const text = window.prompt('Texte à afficher :', 'Légende')
        if (!text?.trim()) return
        const el: CartoText = {
          id: newElementId(),
          type: 'text',
          position: pos,
          text: text.trim(),
          color: '#0e2a52',
          fontSize: 14,
        }
        updateElements(els => [...els, el])
        setSelectedId(el.id)
        setTool('select')
      }
    }

    map.on('click', onClick)
    return () => { map.off('click', onClick) }
  }, [tool, selectedEquipmentId, updateElements])

  function finishDraft() {
    if (draftPoints.length < 2) return
    const id = newElementId()
    if (tool === 'line') {
      const el: CartoLine = { id, type: 'line', points: draftPoints, nom: 'Ligne', ...DEFAULT_CARTO_STYLE }
      updateElements(els => [...els, el])
      setSelectedId(id)
    }
    if (tool === 'polygon' && draftPoints.length >= 3) {
      const el: CartoPolygon = {
        id, type: 'polygon', points: draftPoints, nom: 'Zone', ...DEFAULT_CARTO_STYLE,
      }
      updateElements(els => [...els, el])
      setSelectedId(id)
    }
    setDraftPoints([])
    setTool('select')
  }

  function deleteSelected() {
    if (!selectedId) return
    updateElements(els => els.filter(e => e.id !== selectedId))
    setSelectedId(null)
  }

  function clearAll() {
    if (!window.confirm('Effacer tous les éléments du plan ?')) return
    updateElements(() => [])
    setSelectedId(null)
    setDraftPoints([])
  }

  function centerMap() {
    const map = mapInstance.current
    if (!map) return
    if (plan.parcelleGeometry) {
      const b = boundsFromGeometry(plan.parcelleGeometry)
      if (b) { map.fitBounds(b, { padding: [40, 40], maxZoom: 19 }); return }
    }
    map.setView([plan.center.lat, plan.center.lng], plan.zoom)
  }

  function patchSelected(patch: Partial<CartoElement>) {
    if (!selectedId) return
    updateElements(els => els.map(e => e.id === selectedId ? { ...e, ...patch } as CartoElement : e))
  }

  async function handleExport() {
    const container = mapRef.current?.parentElement
    if (!container) return
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc',
      scale: 2,
    })
    const dataUrl = canvas.toDataURL('image/png')
    const next = { ...plan, exportImage: dataUrl }
    persist(next)

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `plan-anc-${plan.sectionCadastrale}-${plan.numeroParcelle}.png`
    a.click()
  }

  const tools: { id: CartoTool; label: string; icon: string }[] = [
    { id: 'select', label: 'Sélection', icon: '↖' },
    { id: 'equipment', label: 'Équipement', icon: '📍' },
    { id: 'line', label: 'Ligne', icon: '╱' },
    { id: 'polygon', label: 'Polygone', icon: '⬠' },
    { id: 'circle', label: 'Cercle', icon: '○' },
    { id: 'text', label: 'Texte', icon: 'T' },
  ]

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a1a3d] text-white">
      {/* Header */}
      <header className="bg-[#0e2a52] text-white px-3 py-2 sm:px-4 flex items-center gap-2 shrink-0 z-20">
        <button type="button" onClick={onBack} className="text-sm hover:opacity-80 shrink-0">← Retour</button>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-70 truncate">Éditeur de carte</div>
          <div className="font-bold text-sm truncate">
            {plan.adresse} — {plan.commune} · Parcelle {plan.sectionCadastrale} {plan.numeroParcelle}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${saveStatus === 'saved' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10'}`}>
          {saveStatus === 'saving' ? '…' : 'Sauvegardé'}
        </span>
        <button type="button" onClick={handleExport} className="bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg text-sm font-bold shrink-0">
          Exporter
        </button>
      </header>

      {/* Toolbar */}
      <div className="bg-[#0e2a52]/90 backdrop-blur-xl border-b border-white/10 px-2 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0">
        {tools.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTool(t.id); setDraftPoints([]) }}
            className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${tool === t.id ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            title={t.label}
          >
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
        <span className="w-px h-6 bg-white/20 mx-1" />
        <button type="button" onClick={deleteSelected} disabled={!selectedId} className="px-2 py-1.5 text-sm text-red-300 disabled:opacity-40">Supprimer</button>
        <button type="button" onClick={clearAll} className="px-2 py-1.5 text-sm text-white/60">Tout effacer</button>
        <button type="button" onClick={centerMap} className="px-2 py-1.5 text-sm text-white/60">Centrer</button>
        {(tool === 'line' || tool === 'polygon') && draftPoints.length >= 2 && (
          <button type="button" onClick={finishDraft} className="px-2 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-bold">
            Terminer ({draftPoints.length} pts)
          </button>
        )}
        <button type="button" onClick={() => setShowEquip(v => !v)} className="ml-auto px-2 py-1.5 text-xs text-slate-500 lg:hidden">
          {showEquip ? '◧' : '◨'} Équip.
        </button>
        <button type="button" onClick={() => setShowProps(v => !v)} className="px-2 py-1.5 text-xs text-slate-500 lg:hidden">
          {showProps ? '◨' : '◧'} Props
        </button>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Équipements */}
        <aside className={`${showEquip ? 'flex' : 'hidden'} lg:flex flex-col w-56 xl:w-64 bg-[#102a43]/95 backdrop-blur-xl border-r border-white/10 shrink-0 absolute lg:relative inset-y-0 left-0 z-10 shadow-lg lg:shadow-none`}>
          <div className="p-3 border-b border-slate-100">
            <h2 className="font-bold text-white text-sm mb-2">Équipements</h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="spanc-input text-sm"
            />
          </div>
          <ul className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredEquip.map(eq => (
              <li key={eq.id}>
                <button
                  type="button"
                  onClick={() => { setSelectedEquipmentId(eq.id); setTool('equipment') }}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-colors ${selectedEquipmentId === eq.id && tool === 'equipment' ? 'bg-orange-500/15 ring-2 ring-orange-400/50' : 'hover:bg-white/5'}`}
                >
                  <span className="text-lg">{eq.icon}</span>
                  <span>
                    <span className="block font-medium text-white leading-tight">{eq.label}</span>
                    <span className="block text-[10px] text-white/50">{eq.category}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Carte */}
        <div className="flex-1 relative min-w-0">
          <div ref={mapRef} className="absolute inset-0 z-0" />
          {tool !== 'select' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-[#102a43]/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 shadow ring-1 ring-white/10">
              {tool === 'equipment' && `Cliquez pour placer : ${findEquipement(selectedEquipmentId)?.label}`}
              {tool === 'line' && 'Cliquez pour tracer — Terminer pour valider'}
              {tool === 'polygon' && 'Cliquez les sommets — min. 3 points'}
              {tool === 'circle' && 'Cliquez le centre du cercle'}
              {tool === 'text' && 'Cliquez pour placer un texte'}
            </div>
          )}
        </div>

        {/* Propriétés */}
        <aside className={`${showProps ? 'flex' : 'hidden'} lg:flex flex-col w-56 xl:w-72 bg-[#102a43]/95 backdrop-blur-xl border-l border-white/10 shrink-0 absolute lg:relative inset-y-0 right-0 z-10 shadow-lg lg:shadow-none`}>
          <div className="p-3 border-b border-white/10">
            <h2 className="font-bold text-white text-sm">Propriétés</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!selected ? (
              <p className="text-sm text-white/60">Sélectionnez un élément sur la carte pour modifier ses propriétés.</p>
            ) : (
              <PropertiesEditor element={selected} onPatch={patchSelected} onDelete={deleteSelected} />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function PropertiesEditor({
  element,
  onPatch,
  onDelete,
}: {
  element: CartoElement
  onPatch: (p: Partial<CartoElement>) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase text-orange-300/80">{elementLabel(element)}</div>

      <label className="block space-y-1">
        <span className="spanc-label">Nom</span>
        <input
          value={element.nom || ''}
          onChange={e => onPatch({ nom: e.target.value })}
          className="spanc-input text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="spanc-label">Description</span>
        <textarea
          value={element.description || ''}
          onChange={e => onPatch({ description: e.target.value })}
          rows={2}
          className="spanc-input resize-none text-sm"
        />
      </label>

      {element.type === 'circle' && (
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-500">Rayon : {element.radiusM} m</span>
          <input
            type="range"
            min={1}
            max={50}
            value={element.radiusM}
            onChange={e => onPatch({ radiusM: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </label>
      )}

      {element.type === 'text' && (
        <>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-500">Texte</span>
            <input value={element.text} onChange={e => onPatch({ text: e.target.value })} className="prop-input" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-500">Taille : {element.fontSize}px</span>
            <input
              type="range" min={10} max={24} value={element.fontSize}
              onChange={e => onPatch({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </label>
        </>
      )}

      {(element.type === 'line' || element.type === 'polygon' || element.type === 'circle') && (
        <>
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Couleur</span>
            <div className="flex flex-wrap gap-1.5">
              {CARTO_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPatch({ color: c, fillColor: c })}
                  className="w-7 h-7 rounded-full border-2 border-white shadow"
                  style={{ background: c, outline: element.color === c ? '2px solid #0e2a52' : undefined }}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Trait</span>
            <div className="flex gap-1">
              {(['solid', 'dashed', 'dotted'] as LineStyle[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onPatch({ lineStyle: s })}
                  className={`flex-1 py-1 text-xs rounded border ${element.lineStyle === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 text-white/70 border-white/10'}`}
                >
                  {s === 'solid' ? '—' : s === 'dashed' ? '- -' : '···'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Épaisseur</span>
            <div className="flex gap-1">
              {([1, 2, 3, 4] as LineWeight[]).map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onPatch({ weight: w })}
                  className={`flex-1 py-1 text-xs rounded border ${element.weight === w ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 text-white/70 border-white/10'}`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {(element.type === 'polygon' || element.type === 'circle') && (
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-500">Opacité remplissage : {Math.round((element.fillOpacity ?? 0.2) * 100)}%</span>
              <input
                type="range" min={0} max={100}
                value={Math.round((element.fillOpacity ?? 0.2) * 100)}
                onChange={e => onPatch({ fillOpacity: parseInt(e.target.value, 10) / 100 })}
                className="w-full"
              />
            </label>
          )}
        </>
      )}

      {element.type === 'text' && (
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">Couleur texte</span>
          <div className="flex flex-wrap gap-1.5">
            {CARTO_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onPatch({ color: c })}
                className="w-7 h-7 rounded-full border-2 border-white shadow"
                style={{ background: c, outline: element.color === c ? '2px solid #0e2a52' : undefined }}
              />
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={onDelete} className="w-full mt-4 py-2.5 rounded-xl bg-red-500/10 text-red-300 border border-red-400/30 text-sm font-bold hover:bg-red-500/20">
        Supprimer cet élément
      </button>

      <style jsx>{`
        .spanc-label { display:block; margin-bottom:0.25rem; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.2em; color:rgba(253,186,116,0.8); }
      `}</style>
    </div>
  )
}
