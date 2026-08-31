'use client'
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import Link from "next/link"
import VoiceRecorder from "@/components/VoiceRecorder"
import CommuneSensCombobox from "@/components/CommuneSensCombobox"
import CadastreFields from "@/components/CadastreFields"
import { findCommuneByName } from "@/lib/communes-sens"
import type { AttestationData, AttestationObservation, Variante } from "@/components/AttestationPDF"
import { PRETRAITEMENT_LABELS, TRAITEMENT_LABELS, REJET_LABELS, type TypePretraitement, type TypeTraitement, type TypeRejet } from "@/lib/types/spanc"

const AttestationDownloadButton = dynamic(() => import("@/components/AttestationPDF"), { ssr: false })

type Step = 'capture' | 'generating' | 'preview'
type PhotoItem = { file: File; dataUrl: string; preview: string; legende: string }

const VARIANT_OPTIONS: { key: Variante; label: string; desc: string; color: string; icon: string }[] = [
  {
    key: 'tout-a-legout',
    icon: '✅',
    label: 'Conforme — Tout-à-l\'égout',
    desc: 'Raccordement au réseau public collectif (zonage AC)',
    color: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200',
  },
  {
    key: 'fosse-septique',
    icon: '✅',
    label: 'Conforme ANC',
    desc: 'Installation d\'assainissement non collectif fonctionnelle',
    color: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200',
  },
  {
    key: 'conforme-recommandations',
    icon: '🟡',
    label: 'Conforme avec recommandations',
    desc: 'Installation conforme — améliorations souhaitables',
    color: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
  },
  {
    key: 'non-conforme',
    icon: '❌',
    label: 'Non-conforme — travaux prescrits',
    desc: 'Mise en conformité dans un délai de 4 ans',
    color: 'border-red-400/50 bg-red-500/10 text-red-200',
  },
  {
    key: 'risque-sanitaire',
    icon: '🚨',
    label: 'Non-conforme — risque sanitaire',
    desc: 'Mise en conformité urgente (1 an)',
    color: 'border-red-500/60 bg-red-600/15 text-red-100',
  },
  {
    key: 'diagnostic-vente',
    icon: '🏠',
    label: 'Diagnostic de vente',
    desc: 'Validité 3 ans · à annexer à l\'acte de vente',
    color: 'border-orange-400 bg-orange-500/10 ring-1 ring-orange-400/30 text-orange-100',
  },
]

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

async function compressImage(file: File, maxDim = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  const dataUrl = await fileToDataUrl(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim }
        else { width = Math.round(width * maxDim / height); height = maxDim }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas non supporté'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Compression échouée'))
          const compressed = new File([blob], file.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg'), { type: 'image/jpeg' })
          resolve(compressed)
        },
        'image/jpeg', quality,
      )
    }
    img.onerror = () => reject(new Error('Lecture image impossible'))
    img.src = dataUrl
  })
}

export default function AttestationPage() {
  const { data: session } = useSession()

  const [step, setStep] = useState<Step>('capture')
  const [error, setError] = useState('')

  const [variante, setVariante] = useState<Variante>('tout-a-legout')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [adresse, setAdresse] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [ville, setVille] = useState('')
  const [sectionCadastrale, setSectionCadastrale] = useState('')
  const [numeroParcelle, setNumeroParcelle] = useState('')
  const [pretraitement, setPretraitement] = useState<TypePretraitement | ''>('')
  const [traitement, setTraitement] = useState<TypeTraitement | ''>('')
  const [rejet, setRejet] = useState<TypeRejet | ''>('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [technicienNom, setTechnicienNom] = useState('')
  const [transcription, setTranscription] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])

  const [data, setData] = useState<AttestationData | null>(null)

  // Email + sauvegarde
  const [emailClient, setEmailClient] = useState('')
  const [sendingMail, setSendingMail] = useState(false)
  const [savingDrive, setSavingDrive] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('spanc_technicien') : null
    if (saved) setTechnicienNom(saved)
  }, [])
  useEffect(() => {
    if (technicienNom && typeof window !== 'undefined') localStorage.setItem('spanc_technicien', technicienNom)
  }, [technicienNom])

  async function addPhoto(file: File | null) {
    if (!file) return
    try {
      const compressed = await compressImage(file)
      const dataUrl = await fileToDataUrl(compressed)
      const preview = URL.createObjectURL(compressed)
      setPhotos(prev => [...prev, { file: compressed, dataUrl, preview, legende: `Photo ${prev.length + 1}` }])
    } catch (e: any) {
      setError(`Photo : ${e.message || 'erreur'}`)
    }
  }
  function removePhoto(i: number) { setPhotos(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleGenerate() {
    setError('')
    if (transcription.trim().length < 20) { setError('Dicte au moins quelques phrases sur l\'inspection et tes constats.'); return }

    setStep('generating')
    try {
      const res = await fetch('/api/generate-attestation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription,
          variante,
          nom, prenom, adresse,
          code_postal: codePostal, ville,
          date,
          technicien_nom: technicienNom,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Génération échouée')
      // Enrichir le résultat IA avec les champs SPANC saisis côté client
      const enriched: AttestationData = {
        ...(result as AttestationData),
        sectionCadastrale: sectionCadastrale || undefined,
        numeroParcelle: numeroParcelle || undefined,
        filiere: (pretraitement || traitement || rejet) ? {
          pretraitement: pretraitement ? PRETRAITEMENT_LABELS[pretraitement] : undefined,
          traitement: traitement ? TRAITEMENT_LABELS[traitement] : undefined,
          rejet: rejet ? REJET_LABELS[rejet] : undefined,
        } : undefined,
      }
      setData(enriched)
      setStep('preview')
    } catch (e: any) {
      setError(`Erreur IA : ${e.message}`)
      setStep('capture')
    }
  }

  function updateObservation(i: number, patch: Partial<AttestationObservation>) {
    if (!data) return
    const obs = [...data.observations]
    obs[i] = { ...obs[i], ...patch }
    setData({ ...data, observations: obs })
  }
  function removeObservation(i: number) {
    if (!data) return
    setData({ ...data, observations: data.observations.filter((_, idx) => idx !== i) })
  }
  function addObservation() {
    if (!data) return
    setData({ ...data, observations: [...data.observations, { label: '', valeur: '', statut: 'info' }] })
  }

  async function handleSendMailAndAgglo() {
    if (!data) return
    setActionMessage(null)
    if (!emailClient || !/^\S+@\S+\.\S+$/.test(emailClient)) {
      setActionMessage({ kind: 'err', text: 'Renseigne un email client valide.' })
      return
    }
    setSendingMail(true)
    try {
      const res = await fetch('/api/notify-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailClient,
          subject: `Attestation de conformité ${data.numero || ''}`,
          attestation: data,
          archive: 'reseau-spanc-agglo',
        }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Envoi mail / archivage indisponible (${res.status}). ${txt.slice(0, 120)}`)
      }
      setActionMessage({ kind: 'ok', text: `Mail envoyé à ${emailClient} et archivé sur Réseau SPANC Agglo.` })
    } catch (e: any) {
      setActionMessage({ kind: 'err', text: e.message || 'Erreur d\'envoi.' })
    } finally {
      setSendingMail(false)
    }
  }

  async function handleSaveToDrive() {
    if (!data) return
    setActionMessage(null)
    setSavingDrive(true)
    try {
      const res = await fetch('/api/save-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attestation: data }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Google Drive non configuré (${res.status}). ${txt.slice(0, 120)}`)
      }
      const json = await res.json()
      setActionMessage({ kind: 'ok', text: `Enregistré sur Google Drive${json.url ? ` — ${json.url}` : ''}.` })
    } catch (e: any) {
      setActionMessage({ kind: 'err', text: e.message || 'Erreur Google Drive.' })
    } finally {
      setSavingDrive(false)
    }
  }

  /* ===== STEP: GENERATING ===== */
  if (step === 'generating') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />\n        <div className="spanc-card p-8 max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400/30 border-t-[#0f2e5c] mb-4" />
          <h2 className="text-xl font-black text-white">Rédaction de l&apos;attestation…</h2>
          <p className="text-sm text-white/60 mt-2">L&apos;IA structure objet, méthode, relevés et conclusion.</p>
        </div>
      </div>
    )
  }

  /* ===== STEP: PREVIEW ===== */
  if (step === 'preview' && data) {
    const photosForPdf = photos.map(p => ({ url: p.dataUrl, legende: p.legende }))
    const variantLabel = VARIANT_OPTIONS.find(v => v.key === data.variante)?.label || data.variante

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
        <header className="bg-[#0e2a52]/90 backdrop-blur-xl ring-1 ring-white/10 border-b border-white/10 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="text-sm text-white/60 hover:text-white">← Accueil</Link>
            <div className="text-xs uppercase tracking-widest text-orange-300 font-bold">Attestation officielle</div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
          <div className="spanc-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-orange-300 font-bold">Attestation</div>
              <h1 className="text-xl font-black text-white">{data.numero}</h1>
              <p className="text-sm text-white/60">Variante : <span className="font-semibold text-white">{variantLabel}</span> · {data.date}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('capture')} className="px-4 py-2 rounded-lg border border-slate-300 text-white/80 text-sm font-semibold hover:bg-white/5">← Modifier</button>
              <AttestationDownloadButton data={data} photos={photosForPdf} />
            </div>
          </div>

          {/* Identité du bien */}
          <section className="spanc-card p-5 space-y-3">
            <h2 className="font-bold text-white">Propriétaire &amp; bien</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Prénom" value={data.prenom} onChange={v => setData({ ...data, prenom: v })} />
              <Field label="Nom" value={data.nom} onChange={v => setData({ ...data, nom: v })} />
              <Field label="Adresse" value={data.adresse} onChange={v => setData({ ...data, adresse: v })} />
              <Field label="Code postal" value={data.codePostal} onChange={v => setData({ ...data, codePostal: v })} />
              <Field label="Ville" value={data.ville} onChange={v => setData({ ...data, ville: v })} />
              <Field label="Technicien" value={data.technicienNom} onChange={v => setData({ ...data, technicienNom: v })} />
            </div>
          </section>

          {/* Objet */}
          <section className="spanc-card p-5 space-y-2">
            <h2 className="font-bold text-white">Objet de l&apos;intervention</h2>
            <textarea
              value={data.objet}
              onChange={e => setData({ ...data, objet: e.target.value })}
              rows={3}
              className="w-full border-2 border-white/10 focus:border-[#0f2e5c] outline-none rounded-lg px-3 py-2 text-sm"
            />
          </section>

          {/* Méthode */}
          <section className="spanc-card p-5 space-y-2">
            <h2 className="font-bold text-white">Méthodologie de l&apos;inspection</h2>
            <textarea
              value={data.methode}
              onChange={e => setData({ ...data, methode: e.target.value })}
              rows={6}
              className="w-full border-2 border-white/10 focus:border-[#0f2e5c] outline-none rounded-lg px-3 py-2 text-sm"
            />
          </section>

          {/* Cadre normatif */}
          <section className="spanc-card p-5 space-y-3">
            <h2 className="font-bold text-white">Cadre normatif &amp; textes applicables</h2>
            <textarea
              value={data.cadreReglementaire || ''}
              onChange={e => setData({ ...data, cadreReglementaire: e.target.value })}
              rows={4}
              placeholder="Paragraphe juridique : DTU 64.1, arrêtés ANC, portée vente immobilière, délais de mise en conformité…"
              className="w-full border-2 border-white/10 focus:border-[#a78346] outline-none rounded-lg px-3 py-2 text-sm"
            />
            <div className="text-xs uppercase tracking-wide text-white/60 mt-2 mb-1">
              Références citées (une par ligne)
            </div>
            <textarea
              value={(data.referencesNormatives || []).join('\n')}
              onChange={e => setData({ ...data, referencesNormatives: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
              rows={6}
              placeholder="NF DTU 64.1 P1-1 (mars 2013) — …"
              className="w-full border-2 border-white/10 focus:border-[#a78346] outline-none rounded-lg px-3 py-2 text-xs font-mono"
            />
          </section>

          {/* Observations */}
          <section className="spanc-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-white">Relevés techniques</h2>
              <button onClick={addObservation} className="text-sm font-semibold text-orange-200">+ Ligne</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-white/60 border-b border-white/10">
                    <th className="py-2 pr-2">Label</th>
                    <th className="py-2 pr-2">Valeur / constat</th>
                    <th className="py-2 pr-2 w-24">Statut</th>
                    <th className="py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.observations.map((o, i) => (
                    <tr key={i} className="border-b border-white/5 align-top">
                      <td className="py-1 pr-2">
                        <input value={o.label} onChange={e => updateObservation(i, { label: e.target.value })} className="w-full border border-white/10 rounded px-2 py-1" />
                      </td>
                      <td className="py-1 pr-2">
                        <input value={o.valeur} onChange={e => updateObservation(i, { valeur: e.target.value })} className="w-full border border-white/10 rounded px-2 py-1" />
                      </td>
                      <td className="py-1 pr-2">
                        <select value={o.statut} onChange={e => updateObservation(i, { statut: e.target.value as any })} className="w-full border border-white/10 rounded px-2 py-1">
                          <option value="ok">✓ OK</option>
                          <option value="ko">✗ KO</option>
                          <option value="info">• Info</option>
                        </select>
                      </td>
                      <td className="py-1">
                        <button onClick={() => removeObservation(i)} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Variante B fosse */}
          {data.variante === 'fosse-septique' && (
            <section className="spanc-card p-5 space-y-3">
              <h2 className="font-bold text-white">Caractéristiques du dispositif (fosse)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Volume estimé" value={data.fosse?.volume_m3 || ''} onChange={v => setData({ ...data, fosse: { ...(data.fosse || {}), volume_m3: v } })} placeholder="ex: 3 m³" />
                <Field label="État général" value={data.fosse?.etat || ''} onChange={v => setData({ ...data, fosse: { ...(data.fosse || {}), etat: v } })} />
                <Field label="Accessibilité" value={data.fosse?.acces || ''} onChange={v => setData({ ...data, fosse: { ...(data.fosse || {}), acces: v } })} />
                <Field label="Dernière vidange" value={data.fosse?.derniere_vidange || ''} onChange={v => setData({ ...data, fosse: { ...(data.fosse || {}), derniere_vidange: v } })} />
              </div>
            </section>
          )}

          {/* Variante C anomalies / recommandations */}
          {data.variante === 'non-conforme' && (
            <section className="spanc-card p-5 space-y-3">
              <h2 className="font-bold text-white">Anomalies &amp; recommandations</h2>
              <div>
                <div className="text-xs uppercase tracking-wide text-white/60 mb-1">Anomalies (une par ligne)</div>
                <textarea
                  value={(data.anomalies || []).join('\n')}
                  onChange={e => setData({ ...data, anomalies: e.target.value.split('\n').filter(Boolean) })}
                  rows={4}
                  className="w-full border-2 border-white/10 focus:border-red-500 outline-none rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-white/60 mb-1">Recommandations (une par ligne)</div>
                <textarea
                  value={(data.recommandations || []).join('\n')}
                  onChange={e => setData({ ...data, recommandations: e.target.value.split('\n').filter(Boolean) })}
                  rows={3}
                  className="w-full border-2 border-white/10 focus:border-amber-500 outline-none rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </section>
          )}

          {/* Conclusion */}
          <section className="spanc-card p-5 space-y-2">
            <h2 className="font-bold text-white">Conclusion technique</h2>
            <textarea
              value={data.conclusion}
              onChange={e => setData({ ...data, conclusion: e.target.value })}
              rows={4}
              className="w-full border-2 border-white/10 focus:border-[#0f2e5c] outline-none rounded-lg px-3 py-2 text-sm"
            />
            <div className="text-xs uppercase tracking-wide text-white/60 mt-2 mb-1">Réserves (facultatif)</div>
            <textarea
              value={data.reserves || ''}
              onChange={e => setData({ ...data, reserves: e.target.value })}
              rows={2}
              className="w-full border-2 border-white/10 focus:border-amber-500 outline-none rounded-lg px-3 py-2 text-sm"
            />
          </section>

          {/* Envoi & Sauvegarde */}
          <section className="spanc-card p-5 space-y-3">
            <h2 className="font-bold text-white">Envoi &amp; sauvegarde</h2>

            <Field
              label="Email du client (pour envoi mail)"
              value={emailClient}
              onChange={setEmailClient}
              placeholder="client@exemple.fr"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendMailAndAgglo}
                disabled={sendingMail}
                className="flex items-center justify-center gap-2 bg-[#0f2e5c] hover:bg-[#0a2047] disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <span aria-hidden>📧</span>
                {sendingMail ? 'Envoi en cours…' : 'Envoi mail + Réseau SPANC Agglo'}
              </button>

              <button
                type="button"
                onClick={handleSaveToDrive}
                disabled={savingDrive}
                className="flex items-center justify-center gap-2 bg-white border-2 border-[#0f2e5c] text-white hover:bg-white/5 disabled:opacity-60 font-semibold py-3 rounded-xl transition-colors"
              >
                <span aria-hidden>☁️</span>
                {savingDrive ? 'Enregistrement…' : 'Enregistrer sur Google Drive'}
              </button>
            </div>

            {actionMessage && (
              <div
                className={`text-sm rounded-lg px-3 py-2 ${
                  actionMessage.kind === 'ok'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-xl px-4 py-3 text-sm'
                }`}
              >
                {actionMessage.text}
              </div>
            )}
          </section>

          <div className="flex justify-end pb-10">
            <AttestationDownloadButton data={data} photos={photosForPdf} />
          </div>
        </main>
      </div>
    )
  }

  /* ===== STEP: CAPTURE ===== */
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white pb-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      <header className="relative z-20 bg-[#0e2a52]/90 backdrop-blur-xl ring-1 ring-white/10 border-b border-white/10 sticky top-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-sm text-white/60 hover:text-white">← Accueil</Link>
          <div className="text-xs uppercase tracking-widest text-orange-300 font-bold">Attestation officielle</div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-5 space-y-4">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-orange-300 font-bold mb-2">Document probatoire · Notaires &amp; ventes immobilières</div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Attestation de conformité de raccordement</h1>
          <div className="mx-auto mt-3 w-16 h-0.5 bg-[#a78346]" />
        </div>

        {/* Variante */}
        <section className="spanc-card p-5 space-y-3">
          <h2 className="font-bold text-white">Type d&apos;attestation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {VARIANT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setVariante(opt.key)}
                className={`text-left rounded-xl border-2 p-3 transition-all ${variante === opt.key ? `${opt.color} shadow-md` : 'border-white/10 bg-white text-white/70 hover:border-slate-300'}`}
              >
                <div className="font-black">{opt.label}</div>
                <div className="text-xs mt-1 opacity-80">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Propriétaire & bien */}
        <section className="spanc-card p-5 space-y-3">
          <h2 className="font-bold text-white">Propriétaire &amp; bien immobilier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Prénom" value={prenom} onChange={setPrenom} placeholder="Jean" />
            <Field label="Nom" value={nom} onChange={setNom} placeholder="Dupont" />
            <Field label="Adresse du bien" value={adresse} onChange={setAdresse} placeholder="1 place du Château" />
            <Field label="Code postal" value={codePostal} onChange={setCodePostal} />
            <label className="block text-sm">
              <span className="text-xs uppercase tracking-wide text-white/60">Commune</span>
              <div className="mt-1">
                <CommuneSensCombobox
                  value={ville}
                  onChange={setVille}
                  onSelect={c => { setVille(c.nom); if (!codePostal) setCodePostal(c.cp) }}
                  className="w-full border border-white/10 rounded px-2 py-1.5"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="text-xs uppercase tracking-wide text-white/60">Date de l&apos;inspection</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-white/10 rounded px-2 py-1.5 mt-1" />
            </label>
          </div>
        </section>

        {/* Cadastre & filière ANC */}
        <section className="spanc-card p-5 space-y-3">
          <h2 className="font-bold text-white">Cadastre &amp; filière ANC</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CadastreFields
              insee={findCommuneByName(ville)?.insee ?? null}
              section={sectionCadastrale}
              numero={numeroParcelle}
              onSectionChange={setSectionCadastrale}
              onNumeroChange={setNumeroParcelle}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-white/60">Prétraitement</label>
            <select value={pretraitement} onChange={e => setPretraitement(e.target.value as TypePretraitement | '')} className="w-full border border-white/10 rounded px-2 py-1.5 mt-1 bg-white">
              <option value="">— (facultatif)</option>
              {(Object.keys(PRETRAITEMENT_LABELS) as TypePretraitement[]).map(t => (
                <option key={t} value={t}>{PRETRAITEMENT_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-white/60">Traitement</label>
            <select value={traitement} onChange={e => setTraitement(e.target.value as TypeTraitement | '')} className="w-full border border-white/10 rounded px-2 py-1.5 mt-1 bg-white">
              <option value="">— (facultatif)</option>
              {(Object.keys(TRAITEMENT_LABELS) as TypeTraitement[]).map(t => (
                <option key={t} value={t}>{TRAITEMENT_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-white/60">Exutoire / rejet</label>
            <select value={rejet} onChange={e => setRejet(e.target.value as TypeRejet | '')} className="w-full border border-white/10 rounded px-2 py-1.5 mt-1 bg-white">
              <option value="">— (facultatif)</option>
              {(Object.keys(REJET_LABELS) as TypeRejet[]).map(t => (
                <option key={t} value={t}>{REJET_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Technicien */}
        <section className="spanc-card p-5 space-y-2">
          <h2 className="font-bold text-white">Technicien intervenant</h2>
          <Field label="Nom du technicien" value={technicienNom} onChange={setTechnicienNom} placeholder="Prénom Nom" />
          {!technicienNom && session?.user?.name && (
            <button type="button" onClick={() => setTechnicienNom(session.user!.name!)} className="text-xs text-orange-200">↳ Utiliser le nom de session ({session.user.name})</button>
          )}
        </section>

        {/* Dictée */}
        <section className="spanc-card p-5 space-y-4">
          <div>
            <h2 className="font-bold text-white">Récit de l&apos;inspection</h2>
            <p className="text-sm text-white/60 mt-1">
              Dicte ce que tu as inspecté, les moyens utilisés (caméra, ouverture de regard, etc.), les relevés et ta conclusion.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
            <VoiceRecorder onTranscription={t => setTranscription(prev => prev ? prev + ' ' + t : t)} />
          </div>
          <textarea
            value={transcription}
            onChange={e => setTranscription(e.target.value)}
            rows={6}
            placeholder="Ex : Diagnostic ANC vente immobilière au 1 chemin des Oliviers. Filière en place : fosse toutes eaux 3 m³ béton + préfiltre + filtre à sable drainé 25 m². Ouverture des regards, contrôle des niveaux, repérage de l'exutoire. Bon état général, dernière vidange 2024. Aucune odeur. Conforme avec recommandation d'entretien régulier du préfiltre."
            className="w-full border-2 border-white/10 focus:border-[#0f2e5c] outline-none rounded-xl px-4 py-3 text-base"
          />
          <div className="flex justify-between text-xs text-white/50">
            <span>{transcription.length} car.</span>
            <span>{transcription.length < 50 ? 'Détaille davantage' : '✓ OK'}</span>
          </div>
        </section>

        {/* Photos */}
        <section className="spanc-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">Photos d&apos;inspection</h2>
              <p className="text-xs text-white/60 mt-1">Regard ouvert, raccordement, réseau, coloration — facultatif.</p>
            </div>
            <span className="bg-[#0f2e5c] text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">{photos.length}</span>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <div key={p.preview} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt={p.legende} className="w-full h-32 object-cover rounded-lg border border-white/10" />
                  <input
                    value={p.legende}
                    onChange={e => setPhotos(prev => prev.map((x, idx) => idx === i ? { ...x, legende: e.target.value } : x))}
                    className="w-full text-[11px] border border-white/10 rounded mt-1 px-1.5 py-0.5"
                  />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-white rounded-full w-6 h-6 text-red-600 font-bold shadow">×</button>
                </div>
              ))}
            </div>
          )}
          <label className="block">
            <input type="file" accept="image/*" capture="environment" multiple onChange={e => { const files = e.target.files; if (files) { Array.from(files).forEach(f => addPhoto(f)); (e.target as HTMLInputElement).value = '' } }} className="hidden" id="att-photo-input" />
            <label htmlFor="att-photo-input" className="block w-full text-center border-2 border-dashed border-slate-300 text-white/60 hover:border-[#0f2e5c] hover:text-white rounded-xl py-4 cursor-pointer transition-colors">
              + Ajouter des photos
            </label>
          </label>
        </section>

        {error && (
          <div className="text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-xl px-4 py-3 text-sm rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <button
          onClick={handleGenerate}
          disabled={transcription.trim().length < 20}
          className="w-full bg-[#0f2e5c] hover:bg-[#0a2047] disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-colors"
        >
          Générer l&apos;attestation →
        </button>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wide text-white/60">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-white/10 rounded px-2 py-1.5 mt-1" />
    </label>
  )
}
