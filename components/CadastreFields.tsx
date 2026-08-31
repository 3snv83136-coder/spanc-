'use client'
import { useEffect, useRef, useState } from "react"
import { spanc } from "@/lib/spanc-ui"

const sectionsCache = new Map<string, string[]>()
const numerosCache = new Map<string, string[]>()

interface ParcelleInfo {
  idu?: string
  contenance?: number
}

interface Props {
  insee: string | null
  section: string
  numero: string
  onSectionChange: (s: string) => void
  onNumeroChange: (s: string) => void
}

export default function CadastreFields({ insee, section, numero, onSectionChange, onNumeroChange }: Props) {
  const [sections, setSections] = useState<string[]>([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [sectionsErr, setSectionsErr] = useState<string | null>(null)
  const [numeros, setNumeros] = useState<string[]>([])
  const [loadingNumeros, setLoadingNumeros] = useState(false)
  const [parcelle, setParcelle] = useState<ParcelleInfo | null>(null)
  const [validating, setValidating] = useState(false)
  const [validateErr, setValidateErr] = useState<string | null>(null)

  useEffect(() => {
    setParcelle(null)
    setValidateErr(null)
    setNumeros([])
    if (!insee) { setSections([]); return }
    if (sectionsCache.has(insee)) { setSections(sectionsCache.get(insee)!); return }
    let cancelled = false
    setLoadingSections(true)
    setSectionsErr(null)
    fetch(`/api/cadastre?insee=${insee}`)
      .then(r => r.json())
      .then((j: { sections?: string[]; error?: string }) => {
        if (cancelled) return
        if (j.error) { setSectionsErr(j.error); setSections([]); return }
        const list = j.sections || []
        sectionsCache.set(insee, list)
        setSections(list)
      })
      .catch((e: unknown) => {
        if (!cancelled) setSectionsErr(e instanceof Error ? e.message : 'erreur')
      })
      .finally(() => { if (!cancelled) setLoadingSections(false) })
    return () => { cancelled = true }
  }, [insee])

  useEffect(() => {
    setParcelle(null)
    setValidateErr(null)
    if (!insee || !section) { setNumeros([]); return }
    const sec = section.toUpperCase()
    if (!sections.includes(sec)) { setNumeros([]); return }
    const key = `${insee}:${sec}`
    if (numerosCache.has(key)) { setNumeros(numerosCache.get(key)!); return }
    let cancelled = false
    setLoadingNumeros(true)
    fetch(`/api/cadastre?insee=${insee}&section=${encodeURIComponent(sec)}`)
      .then(r => r.json())
      .then((j: { numeros?: string[] }) => {
        if (cancelled) return
        const list = j.numeros || []
        numerosCache.set(key, list)
        setNumeros(list)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingNumeros(false) })
    return () => { cancelled = true }
  }, [insee, section, sections])

  async function validate() {
    if (!insee || !section || !numero) return
    setValidating(true)
    setValidateErr(null)
    try {
      const r = await fetch(
        `/api/cadastre?insee=${insee}&section=${encodeURIComponent(section.toUpperCase())}&numero=${encodeURIComponent(numero)}`,
      )
      const j = await r.json() as { parcelle?: ParcelleInfo | null; error?: string }
      if (j.error) { setValidateErr(j.error); setParcelle(null); return }
      if (!j.parcelle) { setValidateErr('parcelle introuvable'); setParcelle(null); return }
      setParcelle(j.parcelle)
    } catch (e: unknown) {
      setValidateErr(e instanceof Error ? e.message : 'erreur')
    } finally {
      setValidating(false)
    }
  }

  return (
    <>
      <SectionInput
        value={section}
        sections={sections}
        loading={loadingSections}
        error={sectionsErr}
        disabled={!insee}
        onChange={v => onSectionChange(v.toUpperCase())}
      />
      <NumeroInput
        value={numero}
        numeros={numeros}
        loading={loadingNumeros}
        disabled={!insee || !section}
        onChange={onNumeroChange}
        onBlur={validate}
        validating={validating}
        parcelle={parcelle}
        error={validateErr}
      />
    </>
  )
}

function SectionInput({ value, sections, loading, error, disabled, onChange }: {
  value: string
  sections: string[]
  loading: boolean
  error: string | null
  disabled: boolean
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const q = value.trim().toUpperCase()
  const suggestions = q ? sections.filter(s => s.startsWith(q)).slice(0, 12) : sections.slice(0, 12)
  const exact = sections.includes(q)
  return (
    <div ref={ref} className="relative">
      <label className={spanc.label}>Section cadastrale</label>
      <input
        value={value}
        disabled={disabled}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={disabled ? 'Choisir d\'abord une commune' : 'ex: AB'}
        autoComplete="off"
        maxLength={3}
        className={exact ? spanc.inputOk : spanc.input}
      />
      {loading && <span className="absolute right-3 top-9 text-xs text-white/40">chargement…</span>}
      {!loading && exact && <span className="absolute right-3 top-9 text-emerald-400">✓</span>}
      {error && <p className="text-xs text-amber-300 mt-1">Cadastre indisponible — saisie libre OK</p>}
      {open && suggestions.length > 0 && !disabled && (
        <div className={spanc.dropdown}>
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false) }}
              className={`${spanc.dropdownItem} font-mono`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NumeroInput({ value, numeros, loading, disabled, onChange, onBlur, validating, parcelle, error }: {
  value: string
  numeros: string[]
  loading: boolean
  disabled: boolean
  onChange: (v: string) => void
  onBlur: () => void
  validating: boolean
  parcelle: ParcelleInfo | null
  error: string | null
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const q = value.trim()
  const suggestions = q
    ? numeros.filter(n => n.startsWith(q.padStart(Math.min(q.length, 4), '0'))).slice(0, 12)
    : numeros.slice(0, 12)
  return (
    <div ref={ref} className="relative">
      <label className={spanc.label}>N° parcelle</label>
      <input
        value={value}
        disabled={disabled}
        onChange={e => { onChange(e.target.value.replace(/[^0-9]/g, '')); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); onBlur() }}
        placeholder={disabled ? '—' : 'ex: 0042'}
        autoComplete="off"
        inputMode="numeric"
        maxLength={4}
        className={spanc.input}
      />
      {(loading || validating) && <span className="absolute right-3 top-9 text-xs text-white/40">…</span>}
      {!validating && parcelle && (
        <p className="text-xs text-emerald-300 mt-1">
          ✓ Parcelle trouvée
          {typeof parcelle.contenance === 'number' && ` — ${parcelle.contenance.toLocaleString('fr-FR')} m²`}
          {parcelle.idu && <span className="text-white/40 font-mono ml-1">({parcelle.idu})</span>}
        </p>
      )}
      {!validating && error && <p className="text-xs text-amber-300 mt-1">{error}</p>}
      {open && suggestions.length > 0 && !disabled && (
        <div className={spanc.dropdown}>
          {suggestions.map(n => (
            <button
              key={n}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(n); setOpen(false) }}
              className={`${spanc.dropdownItem} font-mono`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
