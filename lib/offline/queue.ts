import { dbGetAll, dbPut, QUEUE_STORE } from '@/lib/offline/db'
import type { GenerateRapportPayload, SendEmailPayload, SyncJob, SyncJobStatus } from '@/lib/offline/types'

function newJobId(): string {
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function listSyncJobs(): Promise<SyncJob[]> {
  const jobs = await dbGetAll<SyncJob>(QUEUE_STORE)
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listPendingSyncJobs(): Promise<SyncJob[]> {
  const jobs = await listSyncJobs()
  return jobs.filter(j => j.status === 'pending' || j.status === 'error')
}

export async function enqueueGenerateJob(
  payload: GenerateRapportPayload,
  numeroRapport: string,
  label: string,
): Promise<SyncJob> {
  const job: SyncJob = {
    id: newJobId(),
    type: 'generate_rapport',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    label,
    numeroRapport,
    generatePayload: payload,
  }
  await dbPut(QUEUE_STORE, job)
  return job
}

export async function enqueueEmailJob(payload: SendEmailPayload, label: string): Promise<SyncJob> {
  const job: SyncJob = {
    id: newJobId(),
    type: 'send_email',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    label,
    numeroRapport: payload.rapport.numeroRapport,
    emailPayload: payload,
  }
  await dbPut(QUEUE_STORE, job)
  return job
}

export async function updateSyncJob(id: string, patch: Partial<SyncJob>): Promise<void> {
  const jobs = await dbGetAll<SyncJob>(QUEUE_STORE)
  const current = jobs.find(j => j.id === id)
  if (!current) return
  await dbPut(QUEUE_STORE, {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}

export async function countPendingSyncJobs(): Promise<number> {
  return (await listPendingSyncJobs()).length
}

export async function markJobStatus(id: string, status: SyncJobStatus, error?: string): Promise<void> {
  await updateSyncJob(id, { status, error })
}
