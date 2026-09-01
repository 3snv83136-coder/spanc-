'use client'

import { POINTS_CONTROLES_STANDARDS, type StatutPointControle } from '@/lib/types/spanc'

export type PointTerrainState = {
  statut: StatutPointControle
  photoUrl?: string
  preview?: string
}

interface Props {
  points: Record<string, PointTerrainState>
  onChange: (key: string, patch: Partial<PointTerrainState>) => void
  onPhoto: (key: string, file: File | null) => void
}

const STATUT_STYLES: Record<StatutPointControle, string> = {
  conforme: 'border-emerald-400/60 bg-emerald-500/15',
  non_conforme: 'border-red-400/60 bg-red-500/15',
  non_verifie: 'border-white/20 bg-white/5',
}

export default function GrilleControlePeriodique({ points, onChange, onPhoto }: Props) {
  return (
    <div className="space-y-3">
      {POINTS_CONTROLES_STANDARDS.map((p, idx) => {
        const st = points[p.key] ?? { statut: 'non_verifie' as StatutPointControle }
        const tone = STATUT_STYLES[st.statut]
        return (
          <article
            key={p.key}
            className={`rounded-2xl border-2 p-4 space-y-3 transition-colors ${tone}`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007B7F] text-white text-sm font-black">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-white leading-snug">{p.label}</h3>
                <p className="text-[11px] text-white/55 mt-0.5">Photo du constat sur ce point</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                ['conforme', '✓ Conforme', 'bg-emerald-500'],
                ['non_conforme', '✗ Non conforme', 'bg-red-500'],
                ['non_verifie', '· Non vérifié', 'bg-slate-500'],
              ] as const).map(([val, label, bg]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange(p.key, { statut: val })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    st.statut === val ? `${bg} text-white shadow-md` : 'bg-black/20 text-white/80 ring-1 ring-white/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              {st.preview ? (
                <div className="relative w-full sm:w-36 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={st.preview} alt="" className="w-full h-28 object-cover rounded-xl ring-2 ring-[#007B7F]/50" />
                  <button
                    type="button"
                    onClick={() => onPhoto(p.key, null)}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold shadow"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full sm:w-36 h-28 rounded-xl border-2 border-dashed border-[#007B7F]/50 bg-[#007B7F]/10 cursor-pointer hover:bg-[#007B7F]/20 transition-colors">
                  <span className="text-center text-xs font-bold text-[#7dd3d6] px-2">📷 Ajouter photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => onPhoto(p.key, e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              <p className="text-[11px] text-white/50 flex-1 leading-relaxed">
                Cette photo sera intégrée au rapport PDF dans le chapitre « Points de contrôle ».
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function initPointsTerrain(): Record<string, PointTerrainState> {
  return Object.fromEntries(
    POINTS_CONTROLES_STANDARDS.map(p => [p.key, { statut: 'non_verifie' as StatutPointControle }]),
  )
}

export function pointsTerrainToCheckboxes(points: Record<string, PointTerrainState>): Record<string, boolean> {
  return Object.fromEntries(
    POINTS_CONTROLES_STANDARDS.map(p => [p.key, points[p.key]?.statut === 'conforme']),
  )
}
