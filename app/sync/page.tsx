'use client'

import Link from 'next/link'
import { useOffline } from '@/components/OfflineProvider'
import { AVIS_LABELS } from '@/lib/types/spanc'

export default function SyncPage() {
  const { online, pendingJobs, syncing, syncNow, lastSyncResult } = useOffline()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />

      <nav className="relative z-20 bg-[#0e2a52]/90 backdrop-blur-xl px-4 py-3 shadow-lg ring-1 ring-white/10 sticky top-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-xl hover:opacity-80">←</Link>
          <div>
            <div className="font-black text-lg uppercase tracking-wide">Synchronisation</div>
            <div className="text-xs text-orange-300/80">File d&apos;attente hors ligne</div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5">
        <section className="spanc-card p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/50">État réseau</div>
              <div className={`font-bold ${online ? 'text-emerald-300' : 'text-red-300'}`}>
                {online ? 'En ligne' : 'Hors ligne'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={!online || syncing || pendingJobs.length === 0}
              className="spanc-btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
            </button>
          </div>
          {lastSyncResult && (
            <p className="text-sm text-white/70">
              Dernière sync : {lastSyncResult.processed} réussie(s), {lastSyncResult.failed} échec(s)
              {lastSyncResult.emailsSent > 0 && `, ${lastSyncResult.emailsSent} email(s) envoyé(s)`}.
            </p>
          )}
        </section>

        {pendingJobs.length === 0 ? (
          <section className="spanc-card p-8 text-center text-white/60">
            Aucune action en attente.
          </section>
        ) : (
          <ul className="space-y-3">
            {pendingJobs.map(job => (
              <li key={job.id} className="spanc-card p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white">{job.label}</div>
                    <div className="text-xs text-white/50">
                      {job.type === 'generate_rapport' ? 'Enrichissement IA' : 'Envoi email'}
                      {job.numeroRapport && ` · ${job.numeroRapport}`}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    job.status === 'error'
                      ? 'bg-red-500/20 text-red-200'
                      : 'bg-amber-500/20 text-amber-200'
                  }`}>
                    {job.status === 'error' ? 'Erreur' : 'En attente'}
                  </span>
                </div>
                {job.error && <p className="text-xs text-red-300">{job.error}</p>}
                {job.emailPayload && (
                  <p className="text-xs text-white/60">
                    → {job.emailPayload.to} · {AVIS_LABELS[job.emailPayload.rapport.avisConformite].short}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <section className="text-blue-200 bg-blue-500/10 ring-1 ring-blue-400/30 rounded-2xl p-4 text-sm">
          <p className="font-bold text-blue-100 mb-1">Mode terrain</p>
          <p className="text-blue-100/90">
            Sur le terrain sans réseau, saisissez le contrôle puis générez un <strong>rapport provisoire</strong>.
            Le PDF est disponible immédiatement. L&apos;enrichissement IA et les emails partent automatiquement au retour du réseau.
          </p>
        </section>
      </div>
    </main>
  )
}
