export type TypeRdv =
  | 'periodique'
  | 'conception'
  | 'execution'
  | 'vente'
  | 'autre'

export type StatutRdv = 'prevu' | 'en_cours' | 'termine' | 'annule'

export interface RendezVous {
  id: string
  date: string // YYYY-MM-DD
  heure: string // HH:mm
  dureeMin: number
  type: TypeRdv
  statut: StatutRdv
  usagerNom: string
  usagerPrenom: string
  adresse: string
  commune: string
  telephone?: string
  notes?: string
  technicien?: string
  createdAt: string
  updatedAt: string
}

export const TYPE_RDV_LABELS: Record<TypeRdv, { label: string; short: string; color: string }> = {
  periodique: { label: 'Contrôle périodique', short: 'Périodique', color: 'bg-blue-500/20 text-blue-200 ring-blue-400/40' },
  conception: { label: 'Contrôle de conception', short: 'Conception', color: 'bg-violet-500/20 text-violet-200 ring-violet-400/40' },
  execution: { label: "Contrôle d'exécution", short: 'Exécution', color: 'bg-orange-500/20 text-orange-200 ring-orange-400/40' },
  vente: { label: 'Diagnostic vente', short: 'Vente', color: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40' },
  autre: { label: 'Autre rendez-vous', short: 'Autre', color: 'bg-white/10 text-white/80 ring-white/20' },
}

export const STATUT_RDV_LABELS: Record<StatutRdv, { label: string; color: string }> = {
  prevu: { label: 'Prévu', color: 'text-cyan-300' },
  en_cours: { label: 'En cours', color: 'text-amber-300' },
  termine: { label: 'Terminé', color: 'text-emerald-300' },
  annule: { label: 'Annulé', color: 'text-red-300' },
}

export function newRdvId(): string {
  return `rdv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function formatHeureFin(heure: string, dureeMin: number): string {
  const [h, m] = heure.split(':').map(Number)
  const total = (h || 0) * 60 + (m || 0) + dureeMin
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
