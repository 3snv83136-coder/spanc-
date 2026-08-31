import type { CartoPlan } from '@/lib/types/cartographie'
import { planStorageKey } from '@/lib/types/cartographie'

const INDEX_KEY = 'spanc_carto_index'
const PLAN_PREFIX = 'spanc_carto_plan_'

export interface CartoPlanIndexEntry {
  key: string
  adresse: string
  commune: string
  sectionCadastrale: string
  numeroParcelle: string
  updatedAt: string
}

function loadIndex(): CartoPlanIndexEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? JSON.parse(raw) as CartoPlanIndexEntry[] : []
  } catch {
    return []
  }
}

function saveIndex(entries: CartoPlanIndexEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries))
}

export function loadCartoPlan(insee: string, section: string, numero: string): CartoPlan | null {
  if (typeof window === 'undefined') return null
  const key = planStorageKey(insee, section, numero)
  try {
    const raw = localStorage.getItem(PLAN_PREFIX + key)
    return raw ? JSON.parse(raw) as CartoPlan : null
  } catch {
    return null
  }
}

export function saveCartoPlan(plan: CartoPlan): void {
  if (typeof window === 'undefined') return
  const key = planStorageKey(plan.insee, plan.sectionCadastrale, plan.numeroParcelle)
  const updated = { ...plan, updatedAt: new Date().toISOString() }
  localStorage.setItem(PLAN_PREFIX + key, JSON.stringify(updated))

  const index = loadIndex().filter(e => e.key !== key)
  index.unshift({
    key,
    adresse: plan.adresse,
    commune: plan.commune,
    sectionCadastrale: plan.sectionCadastrale,
    numeroParcelle: plan.numeroParcelle,
    updatedAt: updated.updatedAt,
  })
  saveIndex(index.slice(0, 200))
}

export function listCartoPlans(): CartoPlanIndexEntry[] {
  return loadIndex()
}

export function deleteCartoPlan(insee: string, section: string, numero: string): void {
  if (typeof window === 'undefined') return
  const key = planStorageKey(insee, section, numero)
  localStorage.removeItem(PLAN_PREFIX + key)
  saveIndex(loadIndex().filter(e => e.key !== key))
}
