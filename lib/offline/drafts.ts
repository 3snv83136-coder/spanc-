import { dbDelete, dbGet, dbPut, DRAFTS_STORE } from '@/lib/offline/db'
import type { ControleDraft } from '@/lib/offline/types'
import { DRAFT_CURRENT_ID } from '@/lib/offline/types'

export async function saveControleDraft(draft: Omit<ControleDraft, 'id' | 'updatedAt'>): Promise<void> {
  const full: ControleDraft = {
    ...draft,
    id: DRAFT_CURRENT_ID,
    updatedAt: new Date().toISOString(),
  }
  await dbPut(DRAFTS_STORE, full)
}

export async function loadControleDraft(): Promise<ControleDraft | null> {
  const draft = await dbGet<ControleDraft>(DRAFTS_STORE, DRAFT_CURRENT_ID)
  return draft ?? null
}

export async function clearControleDraft(): Promise<void> {
  await dbDelete(DRAFTS_STORE, DRAFT_CURRENT_ID)
}
