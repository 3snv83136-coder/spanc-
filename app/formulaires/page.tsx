'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import FormulaireFields from '@/components/formulaires/FormulaireFields'
import {
  FORMULAIRE_META,
  newFormulaire,
  type FormulaireSPANC,
  type TypeFormulaire,
} from '@/lib/formulaires/types'
import { getFormSections } from '@/lib/formulaires/schemas'

const FormulaireDownloadButton = dynamic(
  () => import('@/components/formulaires/FormulaireDownloadButton'),
  { ssr: false },
)

type Step = 'choix' | 'wizard' | 'envoi' | 'done'

const TYPE_ORDER: TypeFormulaire[] = [
  'conception-demande',
  'conception-controle',
  'diagnostic',
]

export default function FormulairesPage() {
  const [agent, setAgent] = useState('')
  const [step, setStep] = useState<Step>('choix')
  const [formType, setFormType] = useState<TypeFormulaire | null>(null)
  const [form, setForm] = useState<FormulaireSPANC | null>(null)
  const [sectionIdx, setSectionIdx] = useState(0)
  const [emailClient, setEmailClient] = useState('')
  const [messageAgent, setMessageAgent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sentInfo, setSentInfo] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('spanc_agent')
    if (saved) setAgent(saved)
  }, [])

  const sections = useMemo(
    () => (formType ? getFormSections(formType) : []),
    [formType],
  )

  const currentSection = sections[sectionIdx]
  const progress = sections.length ? ((sectionIdx + 1) / (sections.length + 1)) * 100 : 0

  function pickType(type: TypeFormulaire) {
    const f = newFormulaire(type, agent)
    setFormType(type)
    setForm(f)
    setSectionIdx(0)
    setEmailClient('')
    setMessageAgent('')
    setError('')
    setStep('wizard')
  }

  function reset() {
    setStep('choix')
    setFormType(null)
    setForm(null)
    setSectionIdx(0)
    setEmailClient('')
    setMessageAgent('')
    setError('')
    setSentInfo('')
  }

  function nextSection() {
    if (sectionIdx < sections.length - 1) {
      setSectionIdx(i => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (form?.coordonnees.email) setEmailClient(form.coordonnees.email)
    setStep('envoi')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function sendToClient() {
    if (!form || !emailClient.trim()) {
      setError('Indiquez l\'adresse e-mail du client.')
      return
    }
    setSending(true)
    setError('')
    try {
      const payload = { ...form, messageAgent: messageAgent.trim() || undefined }
      const res = await fetch('/api/formulaires/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formulaire: payload, to: emailClient.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Envoi impossible')
      setSentInfo(json.testMode
        ? `E-mail de test envoyé à ${json.sentTo} (mode test Resend)`
        : `Formulaire envoyé à ${emailClient.trim()}`)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur envoi')
    } finally {
      setSending(false)
    }
  }

  if (!agent) {
    return (
      <main className="min-h-screen bg-[#0a1a3d] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">📬</div>
          <h1 className="text-xl font-black">Formulaires client</h1>
          <p className="text-white/60 text-sm">Connectez-vous depuis l&apos;accueil pour envoyer des formulaires aux usagers.</p>
          <Link href="/" className="spanc-btn-primary inline-block">Retour accueil</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-20 sticky top-0 bg-[#0e2a52]/90 backdrop-blur-xl ring-1 ring-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="text-white/60 hover:text-white text-sm font-bold">← Accueil</Link>
          <div className="text-center">
            <div className="font-black text-sm uppercase tracking-wide">Formulaires client</div>
            <div className="text-[10px] text-orange-300/80">Envoi simplifié SPANC</div>
          </div>
          <div className="w-16" />
        </div>
        {step !== 'choix' && step !== 'done' && (
          <div className="max-w-lg mx-auto mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-500"
              style={{ width: `${step === 'envoi' ? 100 : progress}%` }}
            />
          </div>
        )}
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* ——— Étape 1 : Choix du formulaire ——— */}
        {step === 'choix' && (
          <>
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 ring-1 ring-orange-400/40 px-4 py-1.5 text-xs font-bold text-orange-200 uppercase tracking-wider">
                🌶️ Mode terrain
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                Quel formulaire<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-200">envoyer au client ?</span>
              </h1>
              <p className="text-white/60 text-sm max-w-sm mx-auto">
                Choisissez, remplissez l&apos;essentiel, envoyez par e-mail. Le client complète, signe et vous renvoie le document.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {TYPE_ORDER.map(type => {
                const meta = FORMULAIRE_META[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => pickType(type)}
                    className={`group w-full text-left rounded-3xl p-1 bg-gradient-to-br ${meta.gradient} shadow-xl ${meta.shadow} transition-transform active:scale-[0.98] hover:scale-[1.01]`}
                  >
                    <div className={`rounded-[22px] bg-[#0a1a3d]/90 backdrop-blur p-5 ring-1 ${meta.ring}`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-3xl shadow-lg`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <div className="font-black text-lg leading-snug">{meta.short}</div>
                          <div className="text-white/70 text-sm mt-1">{meta.subtitle}</div>
                          <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-300 group-hover:text-orange-200">
                            Remplir et envoyer →
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ——— Wizard sections ——— */}
        {step === 'wizard' && form && formType && currentSection && (
          <>
            <button type="button" onClick={reset} className="text-xs text-white/50 hover:text-white underline">
              ← Changer de formulaire
            </button>

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
              <FormulaireFields
                form={form}
                fields={currentSection.fields}
                onChange={setForm}
              />
            </section>

            <div className="flex gap-3">
              {sectionIdx > 0 && (
                <button
                  type="button"
                  onClick={() => setSectionIdx(i => i - 1)}
                  className="spanc-btn-secondary flex-1"
                >
                  Retour
                </button>
              )}
              <button type="button" onClick={nextSection} className="spanc-btn-primary flex-[2] text-base py-4">
                {sectionIdx < sections.length - 1 ? 'Continuer →' : 'Préparer l\'envoi ✉️'}
              </button>
            </div>
          </>
        )}

        {/* ——— Envoi ——— */}
        {step === 'envoi' && form && formType && (
          <>
            <button type="button" onClick={() => setStep('wizard')} className="text-xs text-white/50 hover:text-white underline">
              ← Modifier le formulaire
            </button>

            <div className={`rounded-3xl bg-gradient-to-br ${FORMULAIRE_META[formType].gradient} p-1 shadow-xl`}>
              <div className="rounded-[22px] bg-[#0a1a3d]/95 p-6 space-y-5">
                <div className="text-center">
                  <div className="text-4xl mb-2">{FORMULAIRE_META[formType].icon}</div>
                  <h2 className="text-xl font-black">Envoyer au client</h2>
                  <p className="text-white/60 text-sm mt-1">
                    {FORMULAIRE_META[formType].title}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 space-y-1 text-sm">
                  <div className="font-bold text-orange-200">
                    {[form.coordonnees.prenom, form.coordonnees.nom].filter(Boolean).join(' ') || '—'}
                  </div>
                  <div className="text-white/70">
                    {form.coordonnees.adresse}, {form.coordonnees.codePostal} {form.coordonnees.commune}
                  </div>
                  <div className="text-[11px] text-white/40 font-mono">{form.numero}</div>
                </div>

                <label className="block space-y-2">
                  <span className="spanc-label">E-mail du client *</span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={emailClient}
                    onChange={e => setEmailClient(e.target.value)}
                    placeholder="client@exemple.fr"
                    className="spanc-input text-lg py-4 text-center font-bold"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="spanc-label">Message personnel (optionnel)</span>
                  <textarea
                    rows={3}
                    value={messageAgent}
                    onChange={e => setMessageAgent(e.target.value)}
                    placeholder="Ex. : Merci de nous retourner ce dossier signé avant le 15/03…"
                    className="spanc-input"
                  />
                </label>

                {error && (
                  <div className="text-sm text-red-200 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl px-4 py-3">{error}</div>
                )}

                <button
                  type="button"
                  disabled={sending || !emailClient.trim()}
                  onClick={sendToClient}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 py-5 text-lg font-black text-[#0a1a3d] shadow-xl shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                >
                  {sending ? 'Envoi en cours…' : '📧 Envoyer le formulaire'}
                </button>

                <div className="flex justify-center">
                  <FormulaireDownloadButton formulaire={{ ...form, messageAgent: messageAgent.trim() || undefined }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ——— Succès ——— */}
        {step === 'done' && (
          <div className="text-center space-y-6 pt-8">
            <div className="text-7xl animate-bounce">✅</div>
            <h2 className="text-2xl font-black text-emerald-300">Formulaire envoyé !</h2>
            <p className="text-white/70">{sentInfo}</p>
            <p className="text-sm text-white/50">
              Le client recevra le PDF pré-rempli avec les instructions pour le compléter et le renvoyer au SPANC.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <button type="button" onClick={reset} className="spanc-btn-primary py-4">
                Envoyer un autre formulaire
              </button>
              <Link href="/" className="spanc-btn-secondary text-center py-3">Retour à l&apos;accueil</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
