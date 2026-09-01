'use client'
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import VoiceRecorder from "@/components/VoiceRecorder"
import RedactionAidePicker, { appendRedactionText } from "@/components/RedactionAidePicker"
import CommuneSensCombobox from "@/components/CommuneSensCombobox"
import CadastreFields from "@/components/CadastreFields"
import GrilleControlePeriodique, {
  initPointsTerrain,
  pointsTerrainToCheckboxes,
  type PointTerrainState,
} from "@/components/GrilleControlePeriodique"
import { useOffline } from "@/components/OfflineProvider"
import {
  TYPE_CONTROLE_LABELS,
  AVIS_LABELS,
  PRETRAITEMENT_LABELS,
  TRAITEMENT_LABELS,
  REJET_LABELS,
  POINTS_CONTROLES_STANDARDS,
  prochaineEcheanceParDefaut,
  type TypeControle,
  type AvisConformite,
  type UsagerSPANC,
  type FiliereSPANC,
  type RapportSPANC,
  type TypePretraitement,
  type TypeTraitement,
  type TypeRejet,
  type StatutPointControle,
} from "@/lib/types/spanc"
import { findCommuneByName } from "@/lib/communes-sens"
import { saveDossier } from "@/lib/sispea/dossiers"
import { loadCartoPlan } from "@/lib/cartographie/storage"
import { buildCartographieUrl } from "@/lib/cartographie/urls"
import { clearControleDraft, loadControleDraft, saveControleDraft } from "@/lib/offline/drafts"
import { enqueueEmailJob, enqueueGenerateJob } from "@/lib/offline/queue"
import { buildOfflineRapport } from "@/lib/offline/template-rapport"
import type { GenerateRapportPayload, StoredPhoto } from "@/lib/offline/types"
import { OFFLINE_SYNC_EVENT } from "@/lib/offline/types"
import type { SyncResult } from "@/lib/offline/sync"

function communeInsee(nom: string): string | null {
  return findCommuneByName(nom)?.insee ?? null
}

function buildPointsControlesFromTerrain(
  points: Record<string, PointTerrainState>,
  apiPoints?: RapportSPANC['pointsControles'],
): RapportSPANC['pointsControles'] {
  return POINTS_CONTROLES_STANDARDS.map(std => {
    const local = points[std.key]
    const api = apiPoints?.find(p => p.key === std.key || p.label === std.label)
    return {
      key: std.key,
      label: std.label,
      statut: api?.statut ?? local?.statut ?? 'non_verifie',
      photoUrl: local?.photoUrl ?? api?.photoUrl,
    }
  })
}

const RapportSPANCDownloadButton = dynamic(() => import("@/components/RapportSPANCPDF"), { ssr: false })

type Step = 'saisie' | 'generating' | 'verif' | 'rapport' | 'sending' | 'done'

const STEPPER = [
  { key: 'saisie', label: 'Saisie & Photos', icon: '🎤' },
  { key: 'verif', label: 'Vérification', icon: '✅' },
  { key: 'rapport', label: 'Rapport', icon: '📄' },
  { key: 'done', label: 'Terminé', icon: '🎉' },
]

function stepperIdx(s: Step): number {
  if (s === 'saisie') return 0
  if (s === 'generating' || s === 'verif') return 1
  if (s === 'rapport' || s === 'sending') return 2
  return 3
}

type PhotoItem = { file: File; dataUrl: string; preview: string; legende: string }

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<File> {
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
          resolve(new File([blob], file.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg', quality,
      )
    }
    img.onerror = () => reject(new Error('Lecture image impossible'))
    img.src = dataUrl
  })
}

export default function NouveauControleSPANCPage() {
  const { online, refreshPending } = useOffline()
  const [step, setStep] = useState<Step>('saisie')
  const [error, setError] = useState('')
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [aiSyncPending, setAiSyncPending] = useState(false)
  const [emailQueued, setEmailQueued] = useState(false)
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftLoaded = useRef(false)

  // Type de contrôle
  const [typeControle, setTypeControle] = useState<TypeControle>('periodique')

  // Usager
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [adresse, setAdresse] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [commune, setCommune] = useState('')
  const [sectionCadastrale, setSectionCadastrale] = useState('')
  const [numeroParcelle, setNumeroParcelle] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [nbPieces, setNbPieces] = useState<number | ''>('')

  // Filière
  const [typePretraitement, setTypePretraitement] = useState<TypePretraitement | ''>('')
  const [volumePretraitement, setVolumePretraitement] = useState<number | ''>('')
  const [typeTraitement, setTypeTraitement] = useState<TypeTraitement | ''>('')
  const [typeRejet, setTypeRejet] = useState<TypeRejet | ''>('')
  const [dateInstallation, setDateInstallation] = useState('')
  const [derniereVidange, setDerniereVidange] = useState('')

  // Contrôle terrain
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({})
  const [niveauBoues, setNiveauBoues] = useState(20)
  const [avisAgent, setAvisAgent] = useState<AvisConformite>('conforme')
  const [dictee, setDictee] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [photoMaison, setPhotoMaison] = useState<PhotoItem | null>(null)
  const [pointsTerrain, setPointsTerrain] = useState<Record<string, PointTerrainState>>(initPointsTerrain)
  const [planRev, setPlanRev] = useState(0)

  // Technicien & date
  const [technicien, setTechnicien] = useState('')
  const [editTech, setEditTech] = useState(false)
  const [dateControle, setDateControle] = useState(new Date().toISOString().slice(0, 10))

  // Rapport résultat
  const [rapport, setRapport] = useState<RapportSPANC | null>(null)

  // Email envoyé
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('spanc_technicien') : null
    if (saved) setTechnicien(saved)
    else setEditTech(true)
  }, [])
  useEffect(() => {
    if (technicien && typeof window !== 'undefined') localStorage.setItem('spanc_technicien', technicien)
  }, [technicien])

  useEffect(() => {
    function refreshPlan() { setPlanRev(v => v + 1) }
    window.addEventListener('focus', refreshPlan)
    window.addEventListener('storage', refreshPlan)
    const onVis = () => { if (document.visibilityState === 'visible') refreshPlan() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', refreshPlan)
      window.removeEventListener('storage', refreshPlan)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  useEffect(() => {
    if (draftLoaded.current) return
    draftLoaded.current = true
    void loadControleDraft().then(draft => {
      if (!draft) return
      setTypeControle(draft.typeControle)
      setNom(draft.nom)
      setPrenom(draft.prenom)
      setAdresse(draft.adresse)
      setCodePostal(draft.codePostal)
      setCommune(draft.commune)
      setSectionCadastrale(draft.sectionCadastrale)
      setNumeroParcelle(draft.numeroParcelle)
      setEmail(draft.email)
      setTelephone(draft.telephone)
      setNbPieces(draft.nbPieces)
      setTypePretraitement(draft.typePretraitement)
      setVolumePretraitement(draft.volumePretraitement)
      setTypeTraitement(draft.typeTraitement)
      setTypeRejet(draft.typeRejet)
      setDateInstallation(draft.dateInstallation)
      setDerniereVidange(draft.derniereVidange)
      setCheckboxes(draft.checkboxes)
      setNiveauBoues(draft.niveauBoues)
      setAvisAgent(draft.avisAgent)
      setDictee(draft.dictee)
      setTechnicien(draft.technicien)
      setDateControle(draft.dateControle)
      setPhotos(draft.photos.map((p, i) => ({
        file: new File([], p.name || `photo-${i + 1}.jpg`, { type: 'image/jpeg' }),
        dataUrl: p.dataUrl,
        preview: p.dataUrl,
        legende: p.legende,
      })))
      setDraftSavedAt(draft.updatedAt)
    })
  }, [])

  const persistDraftNow = useCallback(async () => {
    if (step !== 'saisie') return
    const storedPhotos: StoredPhoto[] = photos.map((p, i) => ({
      dataUrl: p.dataUrl,
      legende: p.legende,
      name: p.file.name || `photo-${i + 1}.jpg`,
    }))
    await saveControleDraft({
      typeControle,
      nom, prenom, adresse, codePostal, commune,
      sectionCadastrale, numeroParcelle,
      email, telephone, nbPieces,
      typePretraitement, volumePretraitement,
      typeTraitement, typeRejet,
      dateInstallation, derniereVidange,
      checkboxes, niveauBoues, avisAgent,
      dictee, photos: storedPhotos,
      technicien, dateControle,
    })
    setDraftSavedAt(new Date().toISOString())
  }, [
    step, typeControle, nom, prenom, adresse, codePostal, commune,
    sectionCadastrale, numeroParcelle, email, telephone, nbPieces,
    typePretraitement, volumePretraitement, typeTraitement, typeRejet,
    dateInstallation, derniereVidange, checkboxes, niveauBoues, avisAgent,
    dictee, photos, technicien, dateControle,
  ])

  useEffect(() => {
    if (step !== 'saisie') return
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current)
    draftSaveTimer.current = setTimeout(() => { void persistDraftNow() }, 1500)
    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current)
    }
  }, [step, persistDraftNow])

  useEffect(() => {
    function onSync(e: Event) {
      const detail = (e as CustomEvent<SyncResult>).detail
      if (!rapport || !aiSyncPending) return
      const match = detail.enrichedReports.find(r => r.numeroRapport === rapport.numeroRapport)
      if (!match) return
      setRapport({ ...match.rapport, photos: rapport.photos })
      setAiSyncPending(false)
    }
    window.addEventListener(OFFLINE_SYNC_EVENT, onSync)
    return () => window.removeEventListener(OFFLINE_SYNC_EVENT, onSync)
  }, [rapport, aiSyncPending])

  function selectCommune(c: { nom: string; cp: string; insee: string }) {
    setCommune(c.nom)
    if (!codePostal) setCodePostal(c.cp)
  }

  async function addPhoto(file: File | null) {
    if (!file) return
    try {
      const compressed = await compressImage(file)
      const dataUrl = await fileToDataUrl(compressed)
      const preview = URL.createObjectURL(compressed)
      setPhotos(prev => [...prev, { file: compressed, dataUrl, preview, legende: `Photo ${prev.length + 1}` }])
    } catch (e: any) {
      setError(`Erreur photo : ${e.message}`)
    }
  }
  function removePhoto(i: number) { setPhotos(prev => prev.filter((_, idx) => idx !== i)) }
  function setLegende(i: number, l: string) {
    setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, legende: l } : p))
  }

  async function setPhotoMaisonFile(file: File | null) {
    if (!file) { setPhotoMaison(null); return }
    try {
      const compressed = await compressImage(file, 1400, 0.82)
      const dataUrl = await fileToDataUrl(compressed)
      setPhotoMaison({ file: compressed, dataUrl, preview: URL.createObjectURL(compressed), legende: 'Photo du bien' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur photo maison')
    }
  }

  async function setPointPhoto(key: string, file: File | null) {
    if (!file) {
      setPointsTerrain(prev => ({
        ...prev,
        [key]: { ...prev[key], photoUrl: undefined, preview: undefined },
      }))
      return
    }
    try {
      const compressed = await compressImage(file, 1200, 0.78)
      const dataUrl = await fileToDataUrl(compressed)
      setPointsTerrain(prev => ({
        ...prev,
        [key]: { ...prev[key], statut: prev[key]?.statut ?? 'non_verifie', photoUrl: dataUrl, preview: dataUrl },
      }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur photo point')
    }
  }

  function patchPointTerrain(key: string, patch: Partial<PointTerrainState>) {
    setPointsTerrain(prev => {
      const next = { ...prev, [key]: { ...prev[key], ...patch } }
      setCheckboxes(pointsTerrainToCheckboxes(next))
      return next
    })
  }

  const showFiliere = typeControle !== 'conception'
  const showCheckboxes = typeControle === 'periodique' || typeControle === 'vente'
  const showPointsPhotos = typeControle === 'periodique'

  function buildUsager(): UsagerSPANC {
    return {
      nom, prenom, adresse, codePostal, commune,
      sectionCadastrale, numeroParcelle,
      email: email || undefined,
      telephone: telephone || undefined,
      nbPiecesPrincipales: typeof nbPieces === 'number' ? nbPieces : undefined,
    }
  }
  function buildFiliere(): FiliereSPANC {
    return {
      typePretraitement: typePretraitement || undefined,
      volumePretraitement: typeof volumePretraitement === 'number' ? volumePretraitement : undefined,
      typeTraitement: typeTraitement || undefined,
      typeRejet: typeRejet || undefined,
      dateInstallation: dateInstallation || undefined,
      derniereVidange: derniereVidange || undefined,
      niveauBoues,
    }
  }

  function buildGeneratePayload(numeroRapport?: string): GenerateRapportPayload {
    return {
      typeControle,
      usager: buildUsager(),
      filiere: buildFiliere(),
      dictee,
      checkboxes: pointsTerrainToCheckboxes(pointsTerrain),
      niveauBoues,
      avisAgent,
      technicien,
      dateControle,
      numeroRapport,
    }
  }

  async function generateOfflineRapport() {
    const payload = buildGeneratePayload()
    const offlineRapport = buildOfflineRapport({
      ...payload,
      photos: photos.map(p => p.dataUrl),
      photoMaison: photoMaison?.dataUrl,
      pointsTerrain: Object.fromEntries(
        Object.entries(pointsTerrain).map(([k, v]) => [k, { statut: v.statut, photoUrl: v.photoUrl }]),
      ),
    })
    const label = `Rapport ${offlineRapport.usager.commune} — ${offlineRapport.numeroRapport}`
    await enqueueGenerateJob(
      { ...payload, numeroRapport: offlineRapport.numeroRapport },
      offlineRapport.numeroRapport,
      label,
    )
    await refreshPending()
    setRapport(offlineRapport)
    setAiSyncPending(true)
    setStep('verif')
  }

  async function handleGenerate() {
    setError('')
    if (!technicien) { setError('Indique ton nom de technicien.'); return }
    if (!commune) { setError('Renseigne la commune.'); return }
    if (dictee.trim().length < 20) { setError('Dicte au moins quelques phrases sur le contrôle.'); return }

    if (!online) {
      await generateOfflineRapport()
      return
    }

    setStep('generating')
    try {
      const res = await fetch('/api/spanc/rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeneratePayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur génération')
      const fullRapport: RapportSPANC = {
        id: data.rapport.numeroRapport,
        ...data.rapport,
        pointsControles: buildPointsControlesFromTerrain(pointsTerrain, data.rapport.pointsControles),
        photoMaison: photoMaison?.dataUrl,
        photos: photos.map(p => p.dataUrl),
      }
      setRapport(fullRapport)
      setAiSyncPending(false)
      setStep('verif')
    } catch (e: any) {
      if (!navigator.onLine || /fetch|network|failed|load/i.test(String(e.message))) {
        await generateOfflineRapport()
        return
      }
      setError(`Erreur : ${e.message}`)
      setStep('saisie')
    }
  }

  function patchRapport<K extends keyof RapportSPANC>(key: K, value: RapportSPANC[K]) {
    if (!rapport) return
    setRapport({ ...rapport, [key]: value })
  }

  function patchPointControle(i: number, patch: Partial<RapportSPANC['pointsControles'][number]>) {
    if (!rapport) return
    const next = [...rapport.pointsControles]
    next[i] = { ...next[i], ...patch }
    setRapport({ ...rapport, pointsControles: next })
  }

  function persistDossier(r: RapportSPANC) {
    saveDossier({
      numeroRapport: r.numeroRapport,
      typeControle: r.typeControle,
      dateControle: r.dateControle,
      avisConformite: r.avisConformite,
      usager: {
        nom: r.usager.nom,
        prenom: r.usager.prenom,
        adresse: r.usager.adresse,
        commune: r.usager.commune,
        sectionCadastrale: r.usager.sectionCadastrale,
        numeroParcelle: r.usager.numeroParcelle,
      },
    })
  }

  async function handleSendEmail() {
    if (!rapport) return
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setError('Email usager invalide.'); return }

    if (!online) {
      setError('')
      await enqueueEmailJob({
        rapport,
        photos: photos.map(p => ({ url: p.dataUrl, legende: p.legende })),
        planImage: getPlanImageUrl(),
        to: email,
      }, `Email ${rapport.numeroRapport}`)
      await refreshPending()
      setEmailQueued(true)
      setEmailSent(false)
      persistDossier(rapport)
      setStep('done')
      return
    }

    setStep('sending')
    setError('')
    try {
      const res = await fetch('/api/spanc/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rapport,
          photos: photos.map(p => ({ url: p.dataUrl, legende: p.legende })),
          planImage: getPlanImageUrl(),
          to: email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur envoi')
      setEmailSent(true)
      setStep('done')
    } catch (e: any) {
      setError(`Erreur envoi : ${e.message}`)
      setStep('rapport')
    }
  }

  function resetAll() {
    setStep('saisie')
    setError(''); setRapport(null); setEmailSent(false)
    setEmailQueued(false); setAiSyncPending(false)
    setNom(''); setPrenom(''); setAdresse(''); setCodePostal(''); setCommune('')
    setSectionCadastrale(''); setNumeroParcelle('')
    setEmail(''); setTelephone(''); setNbPieces('')
    setTypePretraitement(''); setVolumePretraitement('')
    setTypeTraitement(''); setTypeRejet('')
    setDateInstallation(''); setDerniereVidange('')
    setCheckboxes({}); setNiveauBoues(20); setAvisAgent('conforme')
    setDictee(''); setPhotos([])
    setPhotoMaison(null)
    setPointsTerrain(initPointsTerrain())
    void clearControleDraft()
    setDraftSavedAt(null)
  }

  function getPlanImageUrl(): string | undefined {
    void planRev
    const insee = communeInsee(commune)
    if (!insee || !sectionCadastrale || !numeroParcelle) return undefined
    return loadCartoPlan(insee, sectionCadastrale, numeroParcelle)?.exportImage
  }

  const canOpenCarto = Boolean(adresse.trim() && commune.trim() && sectionCadastrale.trim() && numeroParcelle.trim() && communeInsee(commune))
  const cartoHref = buildCartographieUrl({
    adresse,
    codePostal,
    commune,
    section: sectionCadastrale,
    numero: numeroParcelle,
    returnTo: '/nouveau',
    auto: canOpenCarto,
  })
  const hasPlan = Boolean(getPlanImageUrl())

  const idx = stepperIdx(step)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white pb-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      {/* Nav */}
      <nav className="relative z-30 bg-[#0e2a52]/90 backdrop-blur-xl text-white px-4 py-3 sm:px-6 sm:py-4 shadow-lg ring-1 ring-white/10 sticky top-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm hover:opacity-80">
            <span className="text-xl">←</span>
            <div>
              <div className="font-black text-base sm:text-lg leading-tight">SPANC</div>
              <div className="text-[11px] opacity-70">Nouveau contrôle</div>
            </div>
          </Link>
          <div className="text-right flex items-center gap-2">
            {canOpenCarto ? (
              <Link
                href={cartoHref}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  hasPlan
                    ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-500/30'
                    : 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/40 hover:bg-cyan-500/25'
                }`}
                title="Éditer le schéma d'installation (intégré au rapport PDF)"
              >
                🗺️ {hasPlan ? 'Plan ✓' : 'Plan'}
              </Link>
            ) : (
              <span
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold opacity-40 ring-1 ring-white/10"
                title="Renseignez adresse, commune et parcelle pour ouvrir la cartographie"
              >
                🗺️ Plan
              </span>
            )}
            {editTech ? (
              <input
                autoFocus
                value={technicien}
                onChange={e => setTechnicien(e.target.value)}
                onBlur={() => technicien && setEditTech(false)}
                onKeyDown={e => { if (e.key === 'Enter' && technicien) setEditTech(false) }}
                placeholder="Ton nom"
                className="bg-white/20 placeholder:text-white/60 text-white text-sm font-semibold px-3 py-1.5 rounded-lg outline-none border border-white/30 focus:border-white"
              />
            ) : technicien ? (
              <button onClick={() => setEditTech(true)} className="text-right group">
                <div className="text-[10px] opacity-60 group-hover:opacity-100">Technicien ✎</div>
                <div className="text-sm font-semibold">{technicien}</div>
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Stepper */}
      <div className="spanc-subnav">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {STEPPER.map((s, i) => {
              const active = i === idx
              const done = i < idx
              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all ${
                      done ? 'bg-emerald-500 text-white shadow-md' :
                      active ? 'bg-[#1a4a8a] text-white shadow-lg ring-4 ring-orange-400/30' :
                      'bg-white/10 text-white/70 border-2 border-white/20'
                    }`}>{done ? '✓' : s.icon}</div>
                    <span className={`text-[10px] sm:text-xs mt-1 font-semibold text-center leading-tight ${
                      active ? 'text-white' : done ? 'text-emerald-300' : 'text-white/70'
                    }`}>{s.label}</span>
                  </div>
                  {i < STEPPER.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-all ${
                      i < idx ? 'bg-emerald-400' : 'bg-white/25'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-5 space-y-4">
        {step === 'saisie' && draftSavedAt && (
          <p className="text-xs text-emerald-300/80 text-center">
            💾 Brouillon sauvegardé localement · utilisable hors connexion
          </p>
        )}

        {/* ═════ ÉTAPE 1 — SAISIE ═════ */}
        {step === 'saisie' && (
          <>
            {/* Type de contrôle */}
            <section className="spanc-card p-5 space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Type de contrôle</h2>
                <p className="spanc-muted text-sm mt-1">Choisis la mission du jour.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(TYPE_CONTROLE_LABELS) as TypeControle[]).map(t => {
                  const meta = TYPE_CONTROLE_LABELS[t]
                  return (
                    <button key={t} type="button" onClick={() => setTypeControle(t)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        typeControle === t
                          ? 'spanc-option-active shadow-sm'
                          : 'spanc-option'
                      }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-2xl leading-none">{meta.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-white">{meta.label}</div>
                          <div className="spanc-option-desc mt-0.5">{meta.desc}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Usager */}
            <section className="spanc-card p-5 space-y-3">
              <h2 className="text-xl font-black text-white">Usager & bien</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Prénom" value={prenom} onChange={setPrenom} />
                <Field label="Nom" value={nom} onChange={setNom} />
                <div className="sm:col-span-2">
                  <Field label="Adresse" value={adresse} onChange={setAdresse} placeholder="ex: 5 rue des Champs" />
                </div>
                <div>
                  <label className="spanc-label">Commune *</label>
                  <CommuneSensCombobox value={commune} onChange={setCommune} onSelect={selectCommune} />
                </div>
                <Field label="Code postal" value={codePostal} onChange={setCodePostal} placeholder="89100" />
                <CadastreFields
                  insee={communeInsee(commune)}
                  section={sectionCadastrale}
                  numero={numeroParcelle}
                  onSectionChange={setSectionCadastrale}
                  onNumeroChange={setNumeroParcelle}
                />
                {canOpenCarto && (
                  <div className="sm:col-span-2">
                    <Link
                      href={cartoHref}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 bg-cyan-500/15 border border-cyan-400/40 rounded-xl px-4 py-2.5 hover:bg-cyan-500/25"
                    >
                      🗺️ Éditer le plan d&apos;installation sur fond cadastral
                      {hasPlan && <span className="text-emerald-300 text-xs font-bold">· enregistré</span>}
                    </Link>
                  </div>
                )}
                <Field label="Email" value={email} onChange={setEmail} placeholder="usager@exemple.fr" type="email" />
                <Field label="Téléphone" value={telephone} onChange={setTelephone} placeholder="06 …" />
                <NumberField label="Pièces principales" value={nbPieces} onChange={setNbPieces} placeholder="4" />
                <div>
                  <label className="spanc-label">Date du contrôle</label>
                  <input type="date" value={dateControle} onChange={e => setDateControle(e.target.value)} className="spanc-input" />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#007B7F]/40 bg-[#007B7F]/10 p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-[#7dd3d6]">Photo du bien / de la maison</h3>
                  <p className="text-xs text-white/55">Apparaît en grand sur le rapport PDF (page identification).</p>
                </div>
                {photoMaison ? (
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoMaison.preview} alt="" className="w-full sm:w-48 h-32 object-cover rounded-xl ring-2 ring-[#007B7F]" />
                    <button type="button" onClick={() => setPhotoMaison(null)} className="text-sm text-red-300 font-bold underline">Supprimer</button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-28 rounded-xl border-2 border-dashed border-[#007B7F]/50 bg-[#007B7F]/15 cursor-pointer hover:bg-[#007B7F]/25">
                    <span className="text-sm font-bold text-[#7dd3d6]">📷 Photographier la façade / le bien</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => void setPhotoMaisonFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>
            </section>

            {/* Filière ANC */}
            {showFiliere && (
              <section className="spanc-card p-5 space-y-3">
                <h2 className="text-xl font-black text-white">Filière ANC</h2>

                <div>
                  <label className="spanc-label">Prétraitement</label>
                  <select value={typePretraitement} onChange={e => setTypePretraitement(e.target.value as TypePretraitement | '')} className="spanc-select">
                    <option value="">— Choisir —</option>
                    {(Object.keys(PRETRAITEMENT_LABELS) as TypePretraitement[]).map(t => (
                      <option key={t} value={t}>{PRETRAITEMENT_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <NumberField label="Volume prétraitement (m³)" value={volumePretraitement} onChange={setVolumePretraitement} placeholder="3" />
                  <Field label="Date d'installation" value={dateInstallation} onChange={setDateInstallation} placeholder="ex: 2014" />
                </div>

                <div>
                  <label className="spanc-label">Traitement</label>
                  <select value={typeTraitement} onChange={e => setTypeTraitement(e.target.value as TypeTraitement | '')} className="spanc-select">
                    <option value="">— Choisir —</option>
                    {(Object.keys(TRAITEMENT_LABELS) as TypeTraitement[]).map(t => (
                      <option key={t} value={t}>{TRAITEMENT_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="spanc-label">Rejet / exutoire</label>
                  <select value={typeRejet} onChange={e => setTypeRejet(e.target.value as TypeRejet | '')} className="spanc-select">
                    <option value="">— Choisir —</option>
                    {(Object.keys(REJET_LABELS) as TypeRejet[]).map(t => (
                      <option key={t} value={t}>{REJET_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                <Field label="Dernière vidange" value={derniereVidange} onChange={setDerniereVidange} placeholder="ex: 2023" />

                {/* Slider niveau boues */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="spanc-label">Niveau de boues</label>
                    <span className={`text-sm font-bold ${niveauBoues <= 30 ? 'text-emerald-300' : niveauBoues <= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                      {niveauBoues}%{niveauBoues > 50 ? ' · vidange recommandée' : ''}
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={niveauBoues}
                    onChange={e => setNiveauBoues(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500"
                  />
                </div>
              </section>
            )}

            {/* Grille de contrôle */}
            {showCheckboxes && showPointsPhotos && (
              <section className="spanc-card p-5 space-y-4">
                <div>
                  <h2 className="text-xl font-black text-white">Contrôle périodique — étapes terrain</h2>
                  <p className="text-sm text-white/60 mt-1">Pour chaque point : statut + photo du constat (intégrée au rapport PDF).</p>
                </div>
                <GrilleControlePeriodique
                  points={pointsTerrain}
                  onChange={patchPointTerrain}
                  onPhoto={(key, file) => void setPointPhoto(key, file)}
                />
              </section>
            )}

            {showCheckboxes && !showPointsPhotos && (
              <section className="spanc-card p-5 space-y-2">
                <h2 className="text-xl font-black text-white">Grille de contrôle terrain</h2>
                <p className="text-xs text-white/60">Coche les points conformes.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {POINTS_CONTROLES_STANDARDS.map(p => (
                    <label key={p.key} className={`spanc-check ${pointsTerrain[p.key]?.statut === 'conforme' ? 'spanc-check-active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={pointsTerrain[p.key]?.statut === 'conforme'}
                        onChange={e => patchPointTerrain(p.key, { statut: e.target.checked ? 'conforme' : 'non_verifie' })}
                        className="mt-0.5 h-4 w-4 accent-emerald-400"
                      />
                      <span className={`text-sm ${pointsTerrain[p.key]?.statut === 'conforme' ? 'text-emerald-200 font-semibold' : 'text-white/90'}`}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {/* Avis du technicien */}
            <section className="spanc-card p-5 space-y-3">
              <h2 className="text-xl font-black text-white">Avis du technicien</h2>
              <p className="text-xs text-white/60">L&apos;IA pourra réviser cet avis selon ta dictée.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(AVIS_LABELS) as AvisConformite[]).map(a => {
                  const meta = AVIS_LABELS[a]
                  const active = avisAgent === a
                  return (
                    <button key={a} type="button" onClick={() => setAvisAgent(a)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        active ? `${meta.tone} shadow-md` : 'spanc-option text-white/90'
                      }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{meta.icon}</span>
                        <span className="font-bold text-sm">{meta.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Dictée */}
            <section className="spanc-card p-5 space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Dictée du contrôle</h2>
                <p className="text-sm text-white/60 mt-1">Détaille état de la fosse, ventilation, épandage, rejet, dernière vidange…</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
                <VoiceRecorder onTranscription={t => setDictee(prev => prev ? prev + ' ' + t : t)} />
              </div>
              <RedactionAidePicker
                compact
                targetLabel="la dictée"
                onInsert={text => setDictee(prev => appendRedactionText(prev, text))}
              />
              <textarea
                value={dictee}
                onChange={e => setDictee(e.target.value)}
                rows={6}
                placeholder="Dicte tes observations : état de la fosse, niveau de boues, ventilation, état de l'épandage, rejet, date dernière vidange…"
                className="spanc-input text-base py-3"
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>{dictee.length} car.</span>
                <span>{dictee.length < 50 ? 'Détaille davantage' : '✓ OK'}</span>
              </div>
            </section>

            {/* Photos */}
            <section className="spanc-card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white">Photos</h2>
                  <p className="text-sm text-white/60">Regards, ventilation, exutoire — min. 1 photo</p>
                </div>
                <span className="bg-[#0e2a52] text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">{photos.length}</span>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((p, i) => (
                    <div key={p.preview} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt={p.legende} className="w-full h-32 object-cover rounded-lg border border-white/10" />
                      <input
                        value={p.legende}
                        onChange={e => setLegende(i, e.target.value)}
                        className="spanc-input text-[11px] mt-1 py-0.5"
                      />
                      <button onClick={() => removePhoto(i)} type="button" aria-label="Supprimer"
                        className="absolute top-1 right-1 bg-white/95 w-7 h-7 rounded-full text-red-600 font-bold shadow flex items-center justify-center text-sm">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label htmlFor="add-cam" className="bg-[#0e2a52] text-white px-4 py-3.5 rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition text-center">
                  📸 Prendre photo
                  <input id="add-cam" type="file" accept="image/*" capture="environment" onChange={e => { addPhoto(e.target.files?.[0] || null); (e.target as HTMLInputElement).value = '' }} className="hidden" />
                </label>
                <label htmlFor="add-gal" className="spanc-btn-secondary px-4 py-3.5 rounded-xl text-sm font-bold cursor-pointer active:scale-95 transition text-center">
                  🖼 Galerie
                  <input id="add-gal" type="file" accept="image/*" multiple onChange={async e => {
                    const files = Array.from(e.target.files || [])
                    for (const f of files) await addPhoto(f)
                    ;(e.target as HTMLInputElement).value = ''
                  }} className="hidden" />
                </label>
              </div>
            </section>
          </>
        )}

        {/* ═════ GENERATING ═════ */}
        {step === 'generating' && (
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-8 text-center space-y-3">
            <div className="text-5xl animate-bounce">🤖</div>
            <p className="text-base font-bold text-orange-100">L&apos;IA rédige votre rapport SPANC…</p>
            <p className="text-xs text-white/60">Analyse de la dictée, structuration des points de contrôle, évaluation de conformité…</p>
            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-blue-500/100 animate-pulse rounded-full" style={{ width: '70%' }} />
            </div>
          </div>
        )}

        {/* ═════ ÉTAPE 2 — VÉRIFICATION ═════ */}
        {step === 'verif' && rapport && (
          <>
            {aiSyncPending && (
              <div className="spanc-card p-4 text-sm text-amber-100 bg-amber-500/10 ring-1 ring-amber-400/30 space-y-1">
                <p className="font-bold">📡 Rapport terrain provisoire</p>
                <p className="text-white/70">
                  Vous pouvez télécharger le PDF maintenant. L&apos;enrichissement IA sera appliqué automatiquement au retour du réseau
                  {online ? ' (synchronisation en cours…)' : ''}.
                </p>
              </div>
            )}
            <RapportEditor
              rapport={rapport}
              onPatch={patchRapport}
              onPatchPC={patchPointControle}
              onContinue={() => { persistDossier(rapport); void clearControleDraft(); setStep('rapport') }}
              onBack={() => setStep('saisie')}
              onRegenerate={handleGenerate}
            />
          </>
        )}

        {/* ═════ ÉTAPE 3 — RAPPORT ═════ */}
        {(step === 'rapport' || step === 'sending') && rapport && (
          <RapportApercu
            rapport={rapport}
            photos={photos}
            planImage={getPlanImageUrl()}
            email={email}
            sending={step === 'sending'}
            onSendEmail={handleSendEmail}
            onBack={() => setStep('verif')}
            onFinish={() => setStep('done')}
          />
        )}

        {/* ═════ ÉTAPE 4 — TERMINÉ ═════ */}
        {step === 'done' && rapport && (
          <div className="spanc-card p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">🎉</div>
            <h2 className="text-2xl font-black text-emerald-300">Rapport généré !</h2>
            {emailSent && (
              <p className="text-emerald-300 font-semibold">📧 Email envoyé à {email}</p>
            )}
            {emailQueued && (
              <p className="text-amber-200 font-semibold">📬 Email en attente — sera envoyé à la synchronisation</p>
            )}
            <div className="bg-white/5 rounded-xl p-4 text-left space-y-1">
              <div className="text-xs text-white/60 uppercase tracking-wider">Numéro</div>
              <div className="font-bold text-white">{rapport.numeroRapport}</div>
              <div className="text-xs text-white/60 uppercase tracking-wider mt-2">Avis</div>
              <div className="font-bold">{AVIS_LABELS[rapport.avisConformite].icon} {AVIS_LABELS[rapport.avisConformite].label}</div>
              <div className="text-xs text-white/60 uppercase tracking-wider mt-2">Prochain contrôle</div>
              <div className="font-bold text-white">dans {rapport.prochaineEcheance}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <RapportSPANCDownloadButton rapport={rapport} photos={photos.map(p => ({ url: p.dataUrl, legende: p.legende }))} planImage={getPlanImageUrl()} label="⬇ Télécharger le PDF" />
              <button onClick={resetAll} className="spanc-btn-secondary px-5 py-3 rounded-lg font-bold">
                + Nouveau contrôle
              </button>
            </div>
          </div>
        )}

        {/* Erreur globale */}
        {error && step !== 'generating' && step !== 'sending' && (
          <div className="text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-xl px-4 py-3 text-sm rounded-xl px-4 py-3 text-sm">{error}</div>
        )}
      </main>

      {/* Bottom action bar — étape saisie */}
      {step === 'saisie' && (
        <div className="spanc-bottom-bar">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Link href="/" className="flex-1 spanc-btn-secondary py-3.5 text-sm text-center active:scale-95 transition-all">
              Annuler
            </Link>
            <button
              onClick={handleGenerate}
              disabled={dictee.trim().length < 20 || !commune || !technicien}
              className="flex-[2] spanc-btn-navy py-3.5 text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {online ? '🚀 Générer le rapport' : '📝 Rapport terrain (hors ligne)'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────── Sub-components ───────────── */

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="spanc-label">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="spanc-input" />
    </div>
  )
}

function NumberField({ label, value, onChange, placeholder }: {
  label: string
  value: number | ''
  onChange: (v: number | '') => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="spanc-label">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => {
          const v = e.target.value
          onChange(v === '' ? '' : Number(v))
        }}
        placeholder={placeholder}
        inputMode="numeric"
        className="spanc-input"
      />
    </div>
  )
}

function RapportEditor({
  rapport, onPatch, onPatchPC, onContinue, onBack, onRegenerate,
}: {
  rapport: RapportSPANC
  onPatch: <K extends keyof RapportSPANC>(k: K, v: RapportSPANC[K]) => void
  onPatchPC: (i: number, patch: Partial<RapportSPANC['pointsControles'][number]>) => void
  onContinue: () => void
  onBack: () => void
  onRegenerate: () => void
}) {
  type RedactionTarget = 'constatTechnique' | 'evaluationConformite' | 'prescriptions' | 'observationsTechnicien'
  const [redactionTarget, setRedactionTarget] = useState<RedactionTarget>('constatTechnique')

  const redactionTargets: { key: RedactionTarget; label: string }[] = [
    { key: 'constatTechnique', label: 'Constat technique' },
    { key: 'evaluationConformite', label: 'Évaluation de conformité' },
    { key: 'prescriptions', label: 'Prescriptions' },
    { key: 'observationsTechnicien', label: 'Observations technicien' },
  ]

  function insertRedaction(text: string) {
    if (redactionTarget === 'prescriptions') {
      onPatch('prescriptions', [...rapport.prescriptions, text])
      return
    }
    const current = rapport[redactionTarget] as string
    onPatch(redactionTarget, appendRedactionText(current, text))
  }

  const activeTargetLabel = redactionTargets.find(t => t.key === redactionTarget)?.label ?? ''

  return (
    <div className="space-y-4">
      <section className="spanc-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Vérifier le rapport généré</h2>
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${AVIS_LABELS[rapport.avisConformite].tone}`}>
            {AVIS_LABELS[rapport.avisConformite].icon} {AVIS_LABELS[rapport.avisConformite].short}
          </span>
        </div>

        {rapport.photoMaison && (
          <div className="rounded-xl border-2 border-[#007B7F]/50 bg-[#007B7F]/10 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7dd3d6] mb-2">Photo du bien (PDF)</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rapport.photoMaison} alt="" className="w-full max-h-48 object-cover rounded-lg ring-2 ring-[#007B7F]" />
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
            Champ cible pour l&apos;aide à la rédaction
          </label>
          <select
            value={redactionTarget}
            onChange={e => setRedactionTarget(e.target.value as RedactionTarget)}
            className="spanc-select text-sm max-w-md"
          >
            {redactionTargets.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <RedactionAidePicker
            compact
            targetLabel={activeTargetLabel}
            onInsert={insertRedaction}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Constat technique</label>
          <textarea value={rapport.constatTechnique} rows={4}
            onChange={e => onPatch('constatTechnique', e.target.value)}
            className="spanc-input text-sm" />
        </div>

        <div>
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Évaluation de conformité</label>
          <textarea value={rapport.evaluationConformite} rows={5}
            onChange={e => onPatch('evaluationConformite', e.target.value)}
            className="spanc-input text-sm" />
        </div>
      </section>

      {/* Points de contrôle */}
      <section className="spanc-card p-5 space-y-2">
        <h3 className="text-base font-bold text-white">Points de contrôle</h3>
        <div className="space-y-3">
          {rapport.pointsControles.map((p, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={p.label} onChange={e => onPatchPC(i, { label: e.target.value })}
                  className="flex-1 outline-none border-none text-sm bg-transparent text-white" />
                <select value={p.statut} onChange={e => onPatchPC(i, { statut: e.target.value as StatutPointControle })}
                  className="spanc-select text-xs font-bold py-1">
                  <option value="conforme">✓ Conforme</option>
                  <option value="non_conforme">✗ Non conforme</option>
                  <option value="non_verifie">· Non vérifié</option>
                </select>
              </div>
              {p.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt="" className="w-full max-h-40 object-cover rounded-lg ring-2 ring-[#007B7F]/50" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Prescriptions */}
      <section className="spanc-card p-5 space-y-2">
        <h3 className="text-base font-bold text-white">Prescriptions / Recommandations</h3>
        <textarea
          value={rapport.prescriptions.join('\n')}
          onChange={e => onPatch('prescriptions', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          rows={4}
          placeholder="Une prescription par ligne…"
          className="spanc-input text-sm"
        />
      </section>

      <section className="spanc-card p-5 space-y-2">
        <h3 className="text-base font-bold text-white">Observations du technicien</h3>
        <textarea value={rapport.observationsTechnicien} rows={3}
          onChange={e => onPatch('observationsTechnicien', e.target.value)}
          className="spanc-input text-sm" />
      </section>

      <section className="spanc-card p-5 space-y-3">
        <h3 className="text-base font-bold text-white">Avis & échéance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(AVIS_LABELS) as AvisConformite[]).map(a => {
            const meta = AVIS_LABELS[a]
            const active = rapport.avisConformite === a
            return (
              <button key={a} type="button"
                onClick={() => {
                  onPatch('avisConformite', a)
                  onPatch('prochaineEcheance', prochaineEcheanceParDefaut(a, rapport.typeControle))
                }}
                className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                  active ? `${meta.tone} shadow-md` : 'border-white/20 bg-white/10 text-white/80 hover:border-orange-400/50 hover:bg-white/15'
                }`}>
                <span className="text-lg mr-1">{meta.icon}</span>
                <span className="text-xs font-bold">{meta.label}</span>
              </button>
            )
          })}
        </div>
        <div>
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Prochaine échéance</label>
          <input value={rapport.prochaineEcheance} onChange={e => onPatch('prochaineEcheance', e.target.value)}
            placeholder="ex: 10 ans" className="spanc-input" />
        </div>
      </section>

      <div className="flex gap-3 pb-4">
        <button onClick={onBack} className="flex-1 bg-white/5 text-white/80 py-3 rounded-xl font-bold text-sm">← Modifier la saisie</button>
        <button onClick={onRegenerate} className="flex-1 spanc-btn-secondary py-3 text-sm">🔄 Régénérer</button>
        <button onClick={onContinue} className="flex-[2] bg-[#0e2a52] text-white py-3 rounded-xl font-bold text-sm">Voir le rapport →</button>
      </div>
    </div>
  )
}

function RapportApercu({
  rapport, photos, planImage, email, sending, onSendEmail, onBack, onFinish,
}: {
  rapport: RapportSPANC
  photos: PhotoItem[]
  planImage?: string
  email: string
  sending: boolean
  onSendEmail: () => void
  onBack: () => void
  onFinish: () => void
}) {
  const av = AVIS_LABELS[rapport.avisConformite]
  return (
    <div className="space-y-4">
      <section className="spanc-card p-5 space-y-4">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-amber-700 font-bold mb-2">Rapport SPANC officiel</div>
          <h2 className="text-2xl font-black text-white">{TYPE_CONTROLE_LABELS[rapport.typeControle].label}</h2>
          <p className="text-xs text-white/60 mt-1">{rapport.numeroRapport}</p>
        </div>

        <div className={`border-2 rounded-2xl p-4 text-center ${av.tone}`}>
          <div className="text-3xl mb-1">{av.icon}</div>
          <div className="font-black uppercase tracking-wider">{av.label}</div>
          <div className="text-sm mt-1">Prochain contrôle dans {rapport.prochaineEcheance}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider">Propriétaire</div>
            <div className="font-semibold">{rapport.usager.prenom} {rapport.usager.nom}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider">Adresse</div>
            <div className="font-semibold">{rapport.usager.adresse}, {rapport.usager.codePostal} {rapport.usager.commune}</div>
          </div>
          {(rapport.usager.sectionCadastrale || rapport.usager.numeroParcelle) && (
            <div className="sm:col-span-2">
              <div className="text-xs text-white/60 uppercase tracking-wider">Cadastre</div>
              <div className="font-semibold">Section {rapport.usager.sectionCadastrale || '—'} · Parcelle {rapport.usager.numeroParcelle || '—'}</div>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-white/5">
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Constat technique</div>
            <p className="text-sm leading-relaxed">{rapport.constatTechnique}</p>
          </div>
          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Évaluation</div>
            <p className="text-sm leading-relaxed">{rapport.evaluationConformite}</p>
          </div>
          {rapport.prescriptions.length > 0 && (
            <div>
              <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Prescriptions</div>
              <ul className="space-y-1 text-sm">
                {rapport.prescriptions.map((p, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-red-600 font-bold">▶</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {planImage && (
        <section className="spanc-card p-5 space-y-2">
          <h3 className="font-bold text-white">Schéma d&apos;installation</h3>
          <p className="text-xs text-white/60">Plan cadastral enregistré — inclus dans le PDF du rapport.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={planImage} alt="Schéma d'installation ANC" className="w-full rounded-xl border border-white/10 max-h-64 object-contain bg-white/5" />
        </section>
      )}

      <section className="spanc-card p-5 space-y-3">
        <h3 className="font-bold text-white">Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RapportSPANCDownloadButton
            rapport={rapport}
            photos={photos.map(p => ({ url: p.dataUrl, legende: p.legende }))}
            planImage={planImage}
            label="⬇ Télécharger PDF"
            className="bg-[#0e2a52] text-white px-5 py-3.5 rounded-xl font-bold hover:bg-[#0a2047] disabled:opacity-50 w-full text-center"
          />
          <button
            type="button"
            onClick={onSendEmail}
            disabled={sending || !email}
            className="bg-blue-600 text-white px-5 py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Envoi…' : email ? `📧 Envoyer à ${email}` : '📧 Email manquant'}
          </button>
        </div>
        <button onClick={onFinish} className="w-full mt-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700">
          ✓ Marquer comme terminé
        </button>
      </section>

      <div className="flex gap-3 pb-4">
        <button onClick={onBack} className="flex-1 bg-white/5 text-white/80 py-3 rounded-xl font-bold text-sm">← Corriger</button>
      </div>
    </div>
  )
}
