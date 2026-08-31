import {
  todayISO,
  type RendezVous,
  type StatutRdv,
} from '@/lib/types/planning'

const STORAGE_KEY = 'spanc_planning_rdv'

export function loadRdvs(): RendezVous[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RendezVous[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(list: RendezVous[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function saveRdv(rdv: RendezVous): void {
  const list = loadRdvs()
  const idx = list.findIndex(r => r.id === rdv.id)
  const next = [...list]
  if (idx >= 0) next[idx] = rdv
  else next.unshift(rdv)
  persist(next)
}

export function deleteRdv(id: string): void {
  persist(loadRdvs().filter(r => r.id !== id))
}

export function updateRdvStatut(id: string, statut: StatutRdv): void {
  const list = loadRdvs()
  const idx = list.findIndex(r => r.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], statut, updatedAt: new Date().toISOString() }
  persist(list)
}

export function getRdvsForDate(date: string): RendezVous[] {
  return loadRdvs()
    .filter(r => r.date === date)
    .sort((a, b) => a.heure.localeCompare(b.heure))
}

export function getRdvsToday(): RendezVous[] {
  return getRdvsForDate(todayISO()).filter(r => r.statut !== 'annule')
}

export function getUpcomingRdvs(limit = 5): RendezVous[] {
  const today = todayISO()
  return loadRdvs()
    .filter(r => r.date >= today && r.statut !== 'annule' && r.statut !== 'termine')
    .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`))
    .slice(0, limit)
}

export function countRdvsToday(): number {
  return getRdvsToday().length
}
