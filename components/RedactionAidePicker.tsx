'use client'

import { useMemo, useState } from 'react'
import {
  REDACTION_AIDE_SPANC,
  appendRedactionText,
  type RedactionPhrase,
} from '@/lib/redaction-aide/spanc-phrases'

interface Props {
  onInsert: (text: string) => void
  /** Libellé du champ cible affiché à l'utilisateur */
  targetLabel?: string
  compact?: boolean
}

export default function RedactionAidePicker({ onInsert, targetLabel, compact = false }: Props) {
  const [partId, setPartId] = useState(REDACTION_AIDE_SPANC[0]?.id ?? '')
  const [sectionId, setSectionId] = useState(REDACTION_AIDE_SPANC[0]?.sections[0]?.id ?? '')
  const [phraseId, setPhraseId] = useState('')
  const [open, setOpen] = useState(!compact)

  const part = useMemo(
    () => REDACTION_AIDE_SPANC.find(p => p.id === partId) ?? REDACTION_AIDE_SPANC[0],
    [partId],
  )

  const section = useMemo(
    () => part?.sections.find(s => s.id === sectionId) ?? part?.sections[0],
    [part, sectionId],
  )

  const phrase: RedactionPhrase | undefined = useMemo(
    () => section?.phrases.find(ph => ph.id === phraseId),
    [section, phraseId],
  )

  function handlePartChange(id: string) {
    setPartId(id)
    const nextPart = REDACTION_AIDE_SPANC.find(p => p.id === id)
    const firstSection = nextPart?.sections[0]
    setSectionId(firstSection?.id ?? '')
    setPhraseId('')
  }

  function handleSectionChange(id: string) {
    setSectionId(id)
    setPhraseId('')
  }

  function handleInsert() {
    if (!phrase) return
    onInsert(phrase.text)
    setPhraseId('')
  }

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30 px-3 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/15 transition-colors"
      >
        📝 Aide à la rédaction SPANC
        {targetLabel && <span className="text-amber-200/70 font-normal"> → {targetLabel}</span>}
      </button>
    )
  }

  return (
    <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30 p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-amber-200 uppercase tracking-wide">
            Aide à la rédaction SPANC
          </h3>
          <p className="text-[11px] text-amber-200/70 mt-0.5">
            Arrêté 07/09/2009 · Arrêté 27/04/2012 · DTU 64.1
            {targetLabel && <> · insertion dans <strong>{targetLabel}</strong></>}
          </p>
        </div>
        {compact && (
          <button type="button" onClick={() => setOpen(false)} className="text-amber-200/60 hover:text-amber-200 text-lg leading-none px-1">
            ×
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Partie</span>
          <select
            value={partId}
            onChange={e => handlePartChange(e.target.value)}
            className="spanc-select text-sm"
          >
            {REDACTION_AIDE_SPANC.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Rubrique</span>
          <select
            value={sectionId}
            onChange={e => handleSectionChange(e.target.value)}
            className="spanc-select text-sm"
          >
            {(part?.sections ?? []).map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Formulation</span>
          <select
            value={phraseId}
            onChange={e => setPhraseId(e.target.value)}
            className="spanc-select text-sm"
          >
            <option value="">— Choisir une phrase —</option>
            {(section?.phrases ?? []).map(ph => (
              <option key={ph.id} value={ph.id}>{ph.label}</option>
            ))}
          </select>
        </label>
      </div>

      {phrase && (
        <div className="rounded-lg bg-black/20 p-3 space-y-2">
          <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
            {phrase.text}
          </p>
          <button
            type="button"
            onClick={handleInsert}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Insérer dans {targetLabel || 'le texte'}
          </button>
        </div>
      )}
    </div>
  )
}

export { appendRedactionText }
