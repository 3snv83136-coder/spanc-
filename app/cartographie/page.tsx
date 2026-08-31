'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import CommuneSensCombobox from '@/components/CommuneSensCombobox'
import CadastreFields from '@/components/CadastreFields'
import { findCommuneByName, type CommuneSens } from '@/lib/communes-sens'
import { loadCartoPlan } from '@/lib/cartographie/storage'
import { centroidFromGeometry } from '@/lib/cartographie/geo'
import { planStorageKey, type CartoPlan } from '@/lib/types/cartographie'

const CartographieEditor = dynamic(() => import('@/components/cartographie/CartographieEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[100dvh] flex items-center justify-center bg-slate-100 text-white/70">
      Chargement de la carte…
    </div>
  ),
})

function CartographieContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const autoOpened = useRef(false)
  const [step, setStep] = useState<'setup' | 'editor'>('setup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const returnTo = searchParams.get('return') || ''

  const [adresse, setAdresse] = useState(searchParams.get('adresse') || '')
  const [codePostal, setCodePostal] = useState(searchParams.get('cp') || '')
  const [commune, setCommune] = useState(searchParams.get('commune') || '')
  const [section, setSection] = useState(searchParams.get('section') || '')
  const [numero, setNumero] = useState(searchParams.get('numero') || '')
  const [plan, setPlan] = useState<CartoPlan | null>(null)

  const insee = findCommuneByName(commune)?.insee ?? null

  useEffect(() => {
    const c = searchParams.get('commune')
    if (c) setCommune(c)
  }, [searchParams])

  function selectCommune(c: CommuneSens) {
    setCommune(c.nom)
    setCodePostal(c.cp)
  }

  const openEditor = useCallback(async () => {
    setError('')
    if (!adresse.trim()) { setError('Adresse requise'); return }
    if (!commune.trim()) { setError('Commune requise'); return }
    if (!insee) { setError('Commune non reconnue dans l\'agglo de Sens'); return }
    if (!section.trim() || !numero.trim()) { setError('Section et numéro de parcelle requis'); return }

    setLoading(true)
    try {
      const existing = loadCartoPlan(insee, section, numero)
      if (existing) {
        setPlan(existing)
        setStep('editor')
        return
      }

      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(`${adresse}, ${codePostal} ${commune}`)}`)
      const geoJson = await geoRes.json() as { result?: { lat: number; lng: number } | null; error?: string }
      if (geoJson.error) throw new Error(geoJson.error)

      const cadRes = await fetch(
        `/api/cadastre?insee=${insee}&section=${encodeURIComponent(section.toUpperCase())}&numero=${encodeURIComponent(numero)}`,
      )
      const cadJson = await cadRes.json() as {
        parcelle?: {
          geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
          contenance?: number
        } | null
        error?: string
      }
      if (cadJson.error) throw new Error(cadJson.error)

      const geometry = cadJson.parcelle?.geometry ?? null
      const center = centroidFromGeometry(geometry)
        || (geoJson.result ? { lat: geoJson.result.lat, lng: geoJson.result.lng } : null)
      if (!center) throw new Error('Impossible de localiser la parcelle')

      const newPlan: CartoPlan = {
        id: planStorageKey(insee, section, numero),
        adresse: adresse.trim(),
        codePostal: codePostal.trim(),
        commune: commune.trim(),
        insee,
        sectionCadastrale: section.toUpperCase(),
        numeroParcelle: numero.padStart(4, '0'),
        center,
        zoom: 18,
        parcelleGeometry: geometry,
        elements: [],
        updatedAt: new Date().toISOString(),
      }
      setPlan(newPlan)
      setStep('editor')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [adresse, codePostal, commune, insee, section, numero])

  useEffect(() => {
    if (autoOpened.current) return
    if (searchParams.get('auto') !== '1') return
    if (!adresse.trim() || !commune.trim() || !section.trim() || !numero.trim() || !insee) return
    autoOpened.current = true
    void openEditor()
  }, [adresse, commune, section, numero, insee, searchParams, openEditor])

  function handleEditorBack() {
    if (returnTo.startsWith('/')) {
      router.push(returnTo)
      return
    }
    setStep('setup')
  }

  if (step === 'editor' && plan) {
    return (
      <CartographieEditor
        plan={plan}
        onBack={handleEditorBack}
        backLabel={returnTo ? '← Retour au contrôle' : '← Retour'}
      />
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      <nav className="relative z-20 bg-[#0e2a52]/90 backdrop-blur-xl text-white px-4 py-3 sm:px-6 shadow-lg ring-1 ring-white/10 sticky top-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-xl hover:opacity-80">←</Link>
          <div>
            <div className="font-black text-lg uppercase tracking-wide">Cartographie intégrée</div>
            <div className="text-xs text-orange-300/80">Schéma d&apos;installation sur fond cadastral</div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">
        <section className="spanc-card p-5 space-y-4">
          <h1 className="text-xl font-black text-white">Nouveau plan client</h1>
          <p className="text-sm text-white/70">
            Créez le schéma de l&apos;installation ANC directement sur la parcelle cadastrale.
            Le plan est sauvegardé par client (adresse + parcelle) et exportable en PNG pour les rapports.
          </p>

          <label className="block space-y-1">
            <span className="spanc-label">Adresse *</span>
            <input
              value={adresse}
              onChange={e => setAdresse(e.target.value)}
              placeholder="15 rue des Champs"
              className="spanc-input"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="spanc-label">Code postal</span>
              <input
                value={codePostal}
                onChange={e => setCodePostal(e.target.value)}
                placeholder="89100"
                className="spanc-input"
              />
            </label>
            <CommuneSensCombobox value={commune} onChange={setCommune} onSelect={selectCommune} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <CadastreFields
              insee={insee}
              section={section}
              numero={numero}
              onSectionChange={setSection}
              onNumeroChange={setNumero}
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-xl px-3 py-2">{error}</div>
          )}

          <button
            type="button"
            onClick={openEditor}
            disabled={loading}
            className="w-full spanc-btn-primary disabled:bg-slate-400 text-white py-3.5 rounded-xl font-bold"
          >
            {loading ? 'Chargement de la parcelle…' : 'Ouvrir l\'éditeur de carte →'}
          </button>
        </section>

        <section className="text-blue-200 bg-blue-500/10 ring-1 ring-blue-400/30 rounded-2xl p-4 text-sm space-y-2">
          <p className="font-bold text-blue-100">Fonctionnalités</p>
          <ul className="list-disc list-inside space-y-1 text-blue-100/90">
            <li>Fond cadastral IGN (data.gouv.fr) + parcelle surlignée</li>
            <li>Bibliothèque d&apos;équipements ANC (fosses, filtres, ventilation…)</li>
            <li>Zones, lignes, cercles de distance, légendes</li>
            <li>Sauvegarde automatique par client · Export PNG</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

export default function CartographiePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <CartographieContent />
    </Suspense>
  )
}
