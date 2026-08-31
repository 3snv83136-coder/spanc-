'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { countPendingSyncJobs, listPendingSyncJobs } from '@/lib/offline/queue'
import { processSyncQueue, type SyncResult } from '@/lib/offline/sync'
import type { SyncJob } from '@/lib/offline/types'

interface OfflineContextValue {
  online: boolean
  pendingCount: number
  pendingJobs: SyncJob[]
  syncing: boolean
  lastSyncResult: SyncResult | null
  refreshPending: () => Promise<void>
  syncNow: () => Promise<SyncResult>
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingJobs, setPendingJobs] = useState<SyncJob[]>([])
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  const refreshPending = useCallback(async () => {
    const [count, jobs] = await Promise.all([countPendingSyncJobs(), listPendingSyncJobs()])
    setPendingCount(count)
    setPendingJobs(jobs)
  }, [])

  const syncNow = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { processed: 0, failed: 0, enrichedReports: [], emailsSent: 0, errors: ['Hors ligne'] }
    }
    setSyncing(true)
    try {
      const result = await processSyncQueue()
      setLastSyncResult(result)
      await refreshPending()
      return result
    } finally {
      setSyncing(false)
    }
  }, [refreshPending])

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    void refreshPending()

    const onOnline = () => {
      setOnline(true)
      void syncNow()
    }
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [refreshPending, syncNow])

  const value = useMemo(
    () => ({ online, pendingCount, pendingJobs, syncing, lastSyncResult, refreshPending, syncNow }),
    [online, pendingCount, pendingJobs, syncing, lastSyncResult, refreshPending, syncNow],
  )

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext)
  if (!ctx) throw new Error('useOffline doit être utilisé dans OfflineProvider')
  return ctx
}
