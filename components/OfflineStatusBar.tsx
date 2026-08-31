'use client'

import Link from 'next/link'
import { useOffline } from '@/components/OfflineProvider'

export default function OfflineStatusBar() {
  const { online, pendingCount, syncing, syncNow } = useOffline()

  if (online && pendingCount === 0 && !syncing) return null

  return (
    <div
      className={`relative z-40 px-4 py-2 text-sm ${
        online
          ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30'
          : 'bg-red-500/15 text-red-100 ring-1 ring-red-400/30'
      }`}
    >
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">
          {!online && '📡 Mode hors ligne — saisie et PDF disponibles'}
          {online && pendingCount > 0 && !syncing && `⏳ ${pendingCount} action(s) en attente de synchronisation`}
          {syncing && '🔄 Synchronisation en cours…'}
        </div>
        <div className="flex items-center gap-2">
          {online && pendingCount > 0 && (
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={syncing}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              Synchroniser
            </button>
          )}
          {pendingCount > 0 && (
            <Link href="/sync" className="text-xs font-bold underline underline-offset-2 opacity-90 hover:opacity-100">
              Détails
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
