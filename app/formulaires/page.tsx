'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import FormulaireFields from '@/components/formulaires/FormulaireFields'
import {
  FORMULAIRE_META,
  newFormulaire,
  type FormulaireSPANC,
  type TypeFormulaire,
} from '@/lib/formulaires/types'
import { getAgentPrefillSection } from '@/lib/formulaires/sections'

type Step = 'choix' | 'prefill' | 'envoi' | 'done'

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
  const [emailClient, setEmailClient] = useState('')
  const [messageAgent, setMessageAgent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sentInfo, setSentInfo] = useState('')
  const [fillUrl, setFillUrl] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('spanc_agent')
    if (saved) setAgent(saved)
  }, [])

  const prefillSection = useMemo(
    () => (formType ? getAgentPrefillSection(formType) : null),
    [formType],
  )

  function pickType(type: TypeFormulaire) {
    setFormType(type)
    setForm(newFormulaire(type, agent))
    setEmailClient('')
    setMessageAgent('')
    setError('')
    setFillUrl('')
    setStep('prefill')
  }

  function reset() {
    setStep('choix')
    setFormType(null)
    setForm(null)
    setEmailClient('')
    setMessageAgent('')
    setError('')
    setSentInfo('')
    setFillUrl('')
  }

  async function sendToClient() {
    if (!form || !emailClient.trim()) {
      setError('Indiquez l\'adresse e-mail du client.')
      return
    }
    setSending(true)
    setError('')
    try {
      const payload = {
        ...form,
        coordonnees: { ...form.coordonnees, email: emailClient.trim() },
        messageAgent: messageAgent.trim() || undefined,
      }
      const res = await fetch('/api/formulaires/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formulaire: payload, to: emailClient.trim(), messageAgent: messageAgent.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Envoi impossible')
      setFillUrl(json.fillUrl || '')
      setSentInfo(json.testMode
        ? `E-mail de test envoyé à ${json.sentTo}`
        : `Lien envoyé à ${emailClient.trim()}`)
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

      <header className="relative z-20 sticky top-0 bg-[#0e2a52]/90 backdrop-blur-xl ring-1 ring-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="text-white/60 hover:text-white text-sm font-bold">← Accueil</Link>
          <div className="text-center">
            <div className="font-black text-sm uppercase tracking-wide">Formulaires client</div>
            <div className="text-[10px] text-orange-300/80">Lien en ligne · retour automatique</div>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-5">
        {step === 'choix' && (
          <>
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#007B7F]/25 ring-1 ring-[#007B7F]/40 px-4 py-1.5 text-xs font-bold text-teal-200 uppercase tracking-wider">
                📬 Envoi client
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                Envoyer un formulaire<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-200">à compléter en ligne</span>
              </h1>
              <p className="text-white/60 text-sm max-w-sm mx-auto">
                Le client reçoit un lien personnel, remplit le formulaire, signe et nous le renvoie automatiquement.
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
                    className={`group w-full text-left rounded-3xl p-1 bg-gradient-to-br ${meta.gradient} shadow-xl ${meta.shadow} transition-transform active:scale-[0.98]`}
                  >
                    <div className={`rounded-[22px] bg-[#0a1a3d]/90 backdrop-blur p-5 ring-1 ${meta.ring}`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-3xl shadow-lg`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <div className="font-black text-lg leading-snug">{meta.short}</div>
                          <div className="text-white/70 text-sm mt-1">{meta.subtitle}</div>
                          <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-300">
                            Envoyer au client →
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

        {(step === 'prefill' || step === 'envoi') && form && formType && prefillSection && (
          <>
            <button type="button" onClick={reset} className="text-xs text-white/50 hover:text-white underline">
              ← Changer de formulaire
            </button>

            <div className={`rounded-2xl bg-gradient-to-br ${FORMULAIRE_META[formType].gradient} p-4 ring-1`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{FORMULAIRE_META[formType].icon}</span>
                <div>
                  <h2 className="text-xl font-black">{FORMULAIRE_META[formType].title}</h2>
                  <p className="text-sm text-white/60">Pré-remplissage optionnel — le client complétera le reste</p>
                </div>
              </div>
            </div>

            {step === 'prefill' && (
              <>
                <section className="spanc-card">
                  <FormulaireFields form={form} fields={prefillSection.fields} onChange={setForm} />
                </section>
                <button
                  type="button"
                  onClick={() => {
                    if (form.coordonnees.email) setEmailClient(form.coordonnees.email)
                    setStep('envoi')
                  }}
                  className="spanc-btn-primary w-full py-4 text-base"
                >
                  Continuer vers l&apos;envoi ✉️
                </button>
              </>
            )}

            {step === 'envoi' && (
              <div className={`rounded-3xl bg-gradient-to-br ${FORMULAIRE_META[formType].gradient} p-1 shadow-xl`}>
                <div className="rounded-[22px] bg-[#0a1a3d]/95 p-6 space-y-5">
                  <div className="text-center">
                    <h2 className="text-xl font-black">Envoyer le lien au client</h2>
                    <p className="text-white/60 text-sm mt-1 font-mono">{form.numero}</p>
                  </div>

                  <div className="rounded-xl bg-[#007B7F]/15 ring-1 ring-[#007B7F]/30 p-4 text-sm space-y-2">
                    <div className="font-bold text-teal-200">Ce que recevra le client :</div>
                    <ul className="text-white/70 space-y-1 list-disc pl-4 text-xs">
                      <li>Un e-mail avec un bouton « Remplir mon formulaire »</li>
                      <li>Un formulaire en ligne à compléter section par section</li>
                      <li>Une signature électronique puis envoi automatique au SPANC</li>
                    </ul>
                  </div>

                  <label className="block space-y-2">
                    <span className="spanc-label">E-mail du client *</span>
                    <input
                      type="email"
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
                      placeholder="Ex. : Merci de compléter ce dossier avant le 15/03…"
                      className="spanc-input"
                    />
                  </label>

                  {error && (
                    <div className="text-sm text-red-200 bg-red-500/15 ring-1 ring-red-400/30 rounded-xl px-4 py-3">{error}</div>
                  )}

                  <button
                    type="button"
                    disabled={sending || !emailClient.trim()}
                    onClick={() => void sendToClient()}
                    className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 py-5 text-lg font-black text-[#0a1a3d] shadow-xl disabled:opacity-50"
                  >
                    {sending ? 'Envoi en cours…' : '📧 Envoyer le lien au client'}
                  </button>

                  <button type="button" onClick={() => setStep('prefill')} className="w-full text-sm text-white/50 underline">
                    ← Modifier le pré-remplissage
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 'done' && (
          <div className="text-center space-y-6 pt-8">
            <div className="text-7xl">✅</div>
            <h2 className="text-2xl font-black text-emerald-300">Lien envoyé !</h2>
            <p className="text-white/70">{sentInfo}</p>
            <p className="text-sm text-white/50">
              Le client pourra remplir le formulaire en ligne. Dès qu&apos;il valide, vous recevrez le PDF signé par e-mail.
            </p>
            {fillUrl && (
              <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 text-left space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Lien client (copier si besoin)</div>
                <p className="text-xs text-teal-200 break-all font-mono">{fillUrl}</p>
              </div>
            )}
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
