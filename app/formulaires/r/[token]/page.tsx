'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import FormulaireFields from '@/components/formulaires/FormulaireFields'
import SignaturePad from '@/components/formulaires/SignaturePad'
import {
  FORMULAIRE_META,
  type FormulaireSPANC,
} from '@/lib/formulaires/types'
import { getClientSections } from '@/lib/formulaires/sections'

const FormulaireDownloadButton = dynamic(
  () => import('@/components/formulaires/FormulaireDownloadButton'),
  { ssr: false },
)

type Step = 'loading' | 'wizard' | 'signature' | 'submitting' | 'done' | 'error'

function draftKey(token: string) {
  return `spanc-form-draft:${token.slice(0, 32)}`
}

export default function FormulaireClientPage({ params }: { params: { token: string } }) {
  const token = decodeURIComponent(params.token)
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState('')
  const [messageAgent, setMessageAgent] = useState('')
  const [form, setForm] = useState<FormulaireSPANC | null>(null)
  const [sectionIdx, setSectionIdx] = useState(0)
  const [signature, setSignature] = useState<string | undefined>()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sections = useMemo(
    () => (form ? getClientSections(form.type) : []),
    [form],
  )
  const currentSection = sections[sectionIdx]
  const meta = form ? FORMULAIRE_META[form.type] : null
  const progress = sections.length ? ((sectionIdx + 1) / (sections.length + 1)) * 100 : 0

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formulaires/decode?token=${encodeURIComponent(token)}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Lien invalide')

        let loaded = json.formulaire as FormulaireSPANC
        const draft = localStorage.getItem(draftKey(token))
        if (draft) {
          try {
            loaded = { ...loaded, ...JSON.parse(draft) }
          } catch { /* ignore */ }
        }
        setMessageAgent(json.messageAgent || '')
        setForm(loaded)
        setStep('wizard')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement')
        setStep('error')
      }
    }
    void load()
  }, [token])

  const persistDraft = useCallback((f: FormulaireSPANC) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(token), JSON.stringify(f))
      } catch { /* quota */ }
    }, 800)
  }, [token])

  function updateForm(next: FormulaireSPANC) {
    setForm(next)
    persistDraft(next)
  }

  async function submit() {
    if (!form || !signature) {
      setError('Veuillez signer le formulaire.')
      return
    }
    setStep('submitting')
    setError('')
    try {
      const payload = { ...form, signatureClient: signature }
      const res = await fetch('/api/formulaires/soumettre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, formulaire: payload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Envoi impossible')
      localStorage.removeItem(draftKey(token))
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur envoi')
      setStep('signature')
    }
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a1a3d] text-white flex items-center justify-center">
        <p className="text-white/60">Chargement du formulaire…</p>
      </main>
    )
  }

  if (step === 'error') {
    return (
      <main className="min-h-screen bg-[#0a1a3d] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-black">Lien indisponible</h1>
          <p className="text-white/60 text-sm">{error}</p>
          <p className="text-xs text-white/40">Contactez le SPANC au 03 86 83 12 88 pour obtenir un nouveau lien.</p>
        </div>
      </main>
    )
  }

  if (step === 'done' && form && meta) {
    return (
      <main className="min-h-screen bg-[#0a1a3d] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-md">
          <div className="text-7xl">✅</div>
          <h1 className="text-2xl font-black text-emerald-300">Formulaire envoyé !</h1>
          <p className="text-white/70 text-sm">
            Votre {meta.title.toLowerCase()} (réf. {form.numero}) a bien été transmis au SPANC.
            Un accusé de réception vous a été envoyé par e-mail.
          </p>
        </div>
      </main>
    )
  }

  if (!form || !meta || !currentSection) return null

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />

      <header className="relative z-20 sticky top-0 bg-[#007B7F]/90 backdrop-blur-xl ring-1 ring-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto text-center">
          <div className="font-black text-sm uppercase tracking-wide">SPANC Grand Sénonais</div>
          <div className="text-[10px] text-teal-100/80">{meta.title}</div>
          <div className="text-[10px] text-white/40 font-mono mt-0.5">{form.numero}</div>
        </div>
        {step === 'wizard' && (
          <div className="max-w-lg mx-auto mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#007B7F] to-teal-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-5">
        {messageAgent && step === 'wizard' && sectionIdx === 0 && (
          <div className="rounded-xl bg-orange-500/15 ring-1 ring-orange-400/30 p-4 text-sm">
            <div className="font-bold text-orange-200 text-xs uppercase mb-1">Message du SPANC</div>
            <p className="text-white/80 whitespace-pre-wrap">{messageAgent}</p>
          </div>
        )}

        {step === 'wizard' && (
          <>
            <div className={`rounded-2xl bg-gradient-to-br ${currentSection.color} p-4 ring-1`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentSection.emoji}</span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Étape {sectionIdx + 1} / {sections.length}
                  </div>
                  <h2 className="text-xl font-black">{currentSection.title}</h2>
                </div>
              </div>
            </div>

            <section className="spanc-card">
              <FormulaireFields form={form} fields={currentSection.fields} onChange={updateForm} />
            </section>

            <div className="flex gap-3">
              {sectionIdx > 0 && (
                <button type="button" onClick={() => setSectionIdx(i => i - 1)} className="spanc-btn-secondary flex-1">
                  Retour
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (sectionIdx < sections.length - 1) {
                    setSectionIdx(i => i + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    setStep('signature')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                className="spanc-btn-primary flex-[2] text-base py-4"
              >
                {sectionIdx < sections.length - 1 ? 'Continuer →' : 'Signer et envoyer ✍️'}
              </button>
            </div>
          </>
        )}

        {step === 'signature' || step === 'submitting' ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-[#007B7F]/30 to-teal-500/10 p-4 ring-1 ring-[#007B7F]/40">
              <h2 className="text-xl font-black">Signature & envoi</h2>
              <p className="text-sm text-white/60 mt-1">
                En signant, vous certifiez l&apos;exactitude des informations fournies.
              </p>
            </div>

            <section className="spanc-card space-y-4">
              <SignaturePad value={signature} onChange={setSignature} />
              {error && (
                <div className="text-sm text-red-200 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl px-4 py-3">{error}</div>
              )}
              <button
                type="button"
                disabled={!signature || step === 'submitting'}
                onClick={() => void submit()}
                className="w-full rounded-2xl bg-gradient-to-r from-[#007B7F] to-teal-500 py-5 text-lg font-black text-white shadow-xl disabled:opacity-50"
              >
                {step === 'submitting' ? 'Envoi au SPANC…' : '📤 Envoyer mon formulaire au SPANC'}
              </button>
              <button type="button" onClick={() => setStep('wizard')} className="w-full text-sm text-white/50 underline">
                ← Revenir au formulaire
              </button>
            </section>

            <div className="flex justify-center">
              <FormulaireDownloadButton formulaire={{ ...form, signatureClient: signature }} label="⬇ Aperçu PDF" />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
