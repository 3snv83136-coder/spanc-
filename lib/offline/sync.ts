import type { RapportSPANC } from '@/lib/types/spanc'
import { listPendingSyncJobs, markJobStatus, updateSyncJob } from '@/lib/offline/queue'
import { OFFLINE_SYNC_EVENT } from '@/lib/offline/types'

export interface SyncResult {
  processed: number
  failed: number
  enrichedReports: { numeroRapport: string; rapport: RapportSPANC }[]
  emailsSent: number
  errors: string[]
}

export async function processSyncQueue(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, failed: 0, enrichedReports: [], emailsSent: 0, errors: ['Hors ligne'] }
  }

  const jobs = await listPendingSyncJobs()
  const result: SyncResult = {
    processed: 0,
    failed: 0,
    enrichedReports: [],
    emailsSent: 0,
    errors: [],
  }

  for (const job of jobs) {
    await markJobStatus(job.id, 'processing')
    try {
      if (job.type === 'generate_rapport' && job.generatePayload) {
        const res = await fetch('/api/spanc/rapport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...job.generatePayload,
            numeroRapport: job.numeroRapport,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur génération IA')

        const fullRapport: RapportSPANC = {
          id: data.rapport.numeroRapport,
          ...data.rapport,
        }

        await updateSyncJob(job.id, {
          status: 'done',
          enrichedRapport: fullRapport,
          error: undefined,
        })

        if (job.numeroRapport) {
          result.enrichedReports.push({ numeroRapport: job.numeroRapport, rapport: fullRapport })
        }
        result.processed++
      } else if (job.type === 'send_email' && job.emailPayload) {
        const res = await fetch('/api/spanc/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rapport: job.emailPayload.rapport,
            photos: job.emailPayload.photos,
            planImage: job.emailPayload.planImage,
            to: job.emailPayload.to,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur envoi email')

        await markJobStatus(job.id, 'done')
        result.emailsSent++
        result.processed++
      } else {
        throw new Error('Tâche invalide')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur sync'
      await markJobStatus(job.id, 'error', msg)
      result.failed++
      result.errors.push(`${job.label} : ${msg}`)
    }
  }

  if (result.enrichedReports.length > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT, { detail: result }))
  }

  return result
}
