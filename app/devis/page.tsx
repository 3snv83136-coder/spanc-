'use client'
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import VoiceRecorder from "@/components/VoiceRecorder"
import AppTabs from "@/components/AppTabs"
import type { DevisPDFProps, DevisLineData, EmetteurData, ClientData, DevisData } from "@/components/DevisPDF"

const DevisDownloadButton = dynamic(() => import("@/components/DevisPDF"), { ssr: false })

type Step = 'capture' | 'extracting' | 'generating' | 'preview'

const EMETTEUR_DEFAULT: EmetteurData = {
  raisonSociale: 'SPANC — Spécialiste SPANC',
  adresseLignes: ['700 Avenue du 15ème Corps', '83000 Toulon'],
  telephone: '07 83 63 68 35',
  email: 'contact@votre-domaine-spanc.fr',
  rcs: '',
  capital: '',
  siret: '',
}

function fmtDateISOtoFR(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export default function DevisPage() {
  useSession()
  const [step, setStep] = useState<Step>('capture')
  const [error, setError] = useState('')

  // Capture
  const [transcription, setTranscription] = useState('')
  const [clientNom, setClientNom] = useState('')
  const [clientAdresse, setClientAdresse] = useState('')
  const [clientCP, setClientCP] = useState('')
  const [clientVille, setClientVille] = useState('')
  const [adresseChantier, setAdresseChantier] = useState('idem')
  const [dateDevis, setDateDevis] = useState(new Date().toISOString().split('T')[0])
  const [referenceDossier, setReferenceDossier] = useState('')

  // Résultat IA (éditable)
  const [devis, setDevis] = useState<DevisData | null>(null)

  async function handleExtractClient() {
    if (!transcription || transcription.trim().length < 10) return
    setStep('extracting'); setError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription }),
      })
      const data = await res.json()
      if (data.client_nom && !clientNom) setClientNom(data.client_nom)
      if (data.adresse && !clientAdresse) setClientAdresse(data.adresse)
      if (data.ville && !clientVille) setClientVille(data.ville)
      if (data.code_postal && !clientCP) setClientCP(data.code_postal)
      setStep('capture')
    } catch {
      setStep('capture')
    }
  }

  async function handleGenerate() {
    if (!transcription || transcription.trim().length < 20) {
      setError('Dicte au moins quelques phrases sur les travaux, les quantités et les prix.')
      return
    }
    setError(''); setStep('generating')
    try {
      const res = await fetch('/api/generate-devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription,
          client_nom: clientNom,
          client_adresse: clientAdresse,
          client_ville: clientVille,
          client_code_postal: clientCP,
          date_devis: dateDevis,
          reference_dossier: referenceDossier,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Génération échouée')

      // Si l'IA a détecté un client depuis la dictée, on alimente les champs (n'écrase pas ce qui est déjà saisi)
      if (!clientNom && data.devis?.client_nom_detecte) setClientNom(data.devis.client_nom_detecte)
      if (!clientAdresse && data.devis?.client_adresse_detectee) setClientAdresse(data.devis.client_adresse_detectee)

      setDevis(data.devis)
      setStep('preview')
    } catch (e: any) {
      setError(`Erreur IA : ${e.message}`)
      setStep('capture')
    }
  }

  function updateLine(index: number, patch: Partial<DevisLineData>) {
    if (!devis) return
    const lignes = [...devis.lignes]
    lignes[index] = { ...lignes[index], ...patch }
    setDevis({ ...devis, lignes })
  }

  function removeLine(index: number) {
    if (!devis) return
    setDevis({ ...devis, lignes: devis.lignes.filter((_, i) => i !== index) })
  }

  function addLine() {
    if (!devis) return
    const lastSection = devis.lignes[devis.lignes.length - 1]?.section || '1. Prestations'
    setDevis({
      ...devis,
      lignes: [
        ...devis.lignes,
        { section: lastSection, designation: '', description: '', qte: 1, unite: 'forfait', pu_ht: 0 },
      ],
    })
  }

  const total = devis?.lignes.reduce((s, l) => s + (Number(l.pu_ht) || 0) * (Number(l.qte) || 0), 0) || 0
  const tvaTaux = devis?.tva_taux ?? 10
  const tva = total * tvaTaux / 100
  const ttc = total + tva

  /* =================== RENDER =================== */
  if (step === 'generating') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white flex items-center justify-center p-6">
        <div className="spanc-card p-8 max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400/30 border-t-[#0e2a52] mb-4" />
          <h2 className="text-xl font-black text-white">Analyse de la dictée…</h2>
          <p className="text-sm text-white/75 mt-2">L&apos;IA structure le devis (objet, lignes, conditions, TVA).</p>
        </div>
      </div>
    )
  }

  if (step === 'preview' && devis) {
    const client: ClientData = {
      nom: clientNom || '—',
      adresseLignes: [
        clientAdresse || '',
        [clientCP, clientVille].filter(Boolean).join(' '),
      ].filter(Boolean),
      adresseChantier: adresseChantier || undefined,
    }
    const pdfProps: DevisPDFProps = {
      emetteur: EMETTEUR_DEFAULT,
      client,
      devis,
      phone: EMETTEUR_DEFAULT.telephone,
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
        <header className="bg-[#0e2a52]/90 backdrop-blur-xl ring-1 ring-white/10 border-b border-white/10 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <AppTabs />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Header preview */}
          <div className="spanc-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-white">Devis N° {devis.numero}</h1>
              <p className="text-sm text-white/75">Établi le {fmtDateISOtoFR(devis.date_devis)} · valable {devis.validite_jours} jours</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('capture')}
                className="px-4 py-2 rounded-lg border border-slate-300 text-white/80 text-sm font-semibold hover:bg-white/5"
              >
                ← Modifier la dictée
              </button>
              <DevisDownloadButton {...pdfProps} />
            </div>
          </div>

          {/* Client */}
          <section className="spanc-card p-5 space-y-3">
            <h2 className="font-bold text-white">Client &amp; chantier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom du client" value={clientNom} onChange={setClientNom} placeholder="M. Dupont / SAS Martin…" />
              <Field label="Adresse client" value={clientAdresse} onChange={setClientAdresse} />
              <Field label="Code postal" value={clientCP} onChange={setClientCP} />
              <Field label="Ville" value={clientVille} onChange={setClientVille} />
              <Field label="Adresse du chantier" value={adresseChantier} onChange={setAdresseChantier} placeholder="idem ou adresse différente" />
              <Field label="Référence dossier (optionnel)"
                value={devis.reference_dossier || ''}
                onChange={v => setDevis({ ...devis, reference_dossier: v })}
                placeholder="ex: Rapport d'intervention du 11/04/2026" />
            </div>
          </section>

          {/* Objet */}
          <section className="spanc-card p-5 space-y-2">
            <h2 className="font-bold text-white">Objet du devis</h2>
            <textarea
              value={devis.objet}
              onChange={e => setDevis({ ...devis, objet: e.target.value })}
              rows={3}
              className="spanc-input text-sm transition-colors"
            />
          </section>

          {/* Lignes */}
          <section className="spanc-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Prestations</h2>
              <button onClick={addLine} className="text-sm font-semibold text-orange-200 hover:text-orange-100">+ Ajouter une ligne</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-white/75 border-b border-white/10">
                    <th className="py-2 pr-2">Section</th>
                    <th className="py-2 pr-2">Désignation</th>
                    <th className="py-2 pr-2 w-16">Qté</th>
                    <th className="py-2 pr-2 w-24">Unité</th>
                    <th className="py-2 pr-2 w-28 text-right">P.U. HT €</th>
                    <th className="py-2 pr-2 w-28 text-right">Total HT</th>
                    <th className="py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {devis.lignes.map((l, i) => (
                    <tr key={i} className="border-b border-white/5 align-top">
                      <td className="py-1 pr-2">
                        <input
                          value={l.section || ''}
                          onChange={e => updateLine(i, { section: e.target.value })}
                          className="spanc-input text-sm text-xs"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          value={l.designation}
                          onChange={e => updateLine(i, { designation: e.target.value })}
                          className="spanc-input text-sm mb-1"
                        />
                        <input
                          value={l.description || ''}
                          onChange={e => updateLine(i, { description: e.target.value })}
                          placeholder="précisions (optionnel)"
                          className="spanc-input text-sm text-xs text-white/75"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="number" step="0.01" min="0"
                          value={l.qte}
                          onChange={e => updateLine(i, { qte: Number(e.target.value) })}
                          className="spanc-input text-sm"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          value={l.unite || ''}
                          onChange={e => updateLine(i, { unite: e.target.value })}
                          className="spanc-input text-sm"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="number" step="0.01" min="0"
                          value={l.pu_ht}
                          onChange={e => updateLine(i, { pu_ht: Number(e.target.value) })}
                          className="spanc-input text-sm text-right"
                        />
                      </td>
                      <td className="py-1 pr-2 text-right font-semibold text-white">
                        {(l.qte * l.pu_ht).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </td>
                      <td className="py-1">
                        <button
                          onClick={() => removeLine(i)}
                          className="text-red-500 hover:text-red-700 text-lg leading-none"
                          aria-label="Supprimer la ligne"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-2">
              <div className="w-full sm:w-80 space-y-1 text-sm">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/70">Total HT</span>
                  <span className="font-semibold">{total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5 items-center">
                  <span className="text-white/70">TVA</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="30" step="0.1"
                      value={tvaTaux}
                      onChange={e => setDevis({ ...devis, tva_taux: Number(e.target.value) })}
                      className="spanc-input w-16 text-right text-sm py-1"
                    />
                    <span>%</span>
                    <span className="font-semibold ml-2">{tva.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 bg-[#0e2a52] text-white px-3 rounded-lg">
                  <span className="font-bold">Montant TTC</span>
                  <span className="font-bold">{ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-white/75 mt-2">
                  <input
                    type="checkbox"
                    checked={!!devis.tva_reduite_attestation}
                    onChange={e => setDevis({ ...devis, tva_reduite_attestation: e.target.checked })}
                  />
                  Ajouter l&apos;attestation TVA 10 % (habitation &gt; 2 ans)
                </label>
              </div>
            </div>
          </section>

          {/* Conditions */}
          <section className="spanc-card p-5 space-y-3">
            <h2 className="font-bold text-white">Conditions d&apos;exécution</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Validité" value={devis.conditions?.validite || ''} onChange={v => setDevis({ ...devis, conditions: { ...(devis.conditions || {}), validite: v } })} />
              <Field label="Délai d'exécution" value={devis.conditions?.delai_execution || ''} onChange={v => setDevis({ ...devis, conditions: { ...(devis.conditions || {}), delai_execution: v } })} />
              <Field label="Durée estimée du chantier" value={devis.conditions?.duree_chantier || ''} onChange={v => setDevis({ ...devis, conditions: { ...(devis.conditions || {}), duree_chantier: v } })} />
              <Field label="Garanties" value={devis.conditions?.garanties || ''} onChange={v => setDevis({ ...devis, conditions: { ...(devis.conditions || {}), garanties: v } })} />
              <Field label="Assurance" value={devis.conditions?.assurance || ''} onChange={v => setDevis({ ...devis, conditions: { ...(devis.conditions || {}), assurance: v } })} />
              <Field label="Conditions particulières" value={devis.conditions?.particulieres || ''} onChange={v => setDevis({ ...devis, conditions: { ...(devis.conditions || {}), particulieres: v } })} />
              <Field label="Majoration (note)" value={devis.majoration_note || ''} onChange={v => setDevis({ ...devis, majoration_note: v })} placeholder="ex: 100 % après 17 h, week-ends" />
            </div>
          </section>

          {/* Modalités */}
          <section className="spanc-card p-5 space-y-3">
            <h2 className="font-bold text-white">Modalités de règlement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-white/75">Acompte (%)</span>
                <input
                  type="number" min="0" max="100" step="1"
                  value={devis.modalites?.acompte_pct ?? 30}
                  onChange={e => setDevis({ ...devis, modalites: { ...(devis.modalites || {}), acompte_pct: Number(e.target.value) } })}
                  className="spanc-input text-sm mt-1"
                />
              </label>
              <Field
                label="Modes de paiement (séparés par virgule)"
                value={(devis.modalites?.modes_paiement || []).join(', ')}
                onChange={v => setDevis({ ...devis, modalites: { ...(devis.modalites || {}), modes_paiement: v.split(',').map(s => s.trim()).filter(Boolean) } })}
              />
            </div>
          </section>

          <div className="flex justify-end">
            <DevisDownloadButton {...pdfProps} />
          </div>
        </main>
      </div>
    )
  }

  /* ========= CAPTURE ========= */
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      <header className="relative z-20 bg-[#0e2a52]/90 backdrop-blur-xl ring-1 ring-white/10 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <AppTabs />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Nouveau devis</h1>
          <p className="text-sm text-white/75 mt-1">Dicte les travaux, les quantités et les prix — on s&apos;occupe du reste.</p>
        </div>

        {/* Dictée */}
        <div className="spanc-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black text-white">Raconte le chantier</h2>
            <p className="text-sm text-white/75 mt-1">
              Dicte ou tape. Exemple : « Devis pour M. Dupont à Solliès-Pont — réhabilitation ANC : étude de sol 480 €, fosse toutes eaux 3 m³ 1 850 €, filtre à sable drainé 25 m² 4 200 €, vidange ancienne fosse 280 €, terrassement 8 m³ à 95 € le m³, TVA 10 %. »
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
            <VoiceRecorder onTranscription={t => setTranscription(prev => prev ? prev + ' ' + t : t)} />
          </div>

          <textarea
            value={transcription}
            onChange={e => setTranscription(e.target.value)}
            rows={6}
            placeholder="Dicte les prestations avec leurs quantités et prix…"
            className="spanc-input text-base py-3 transition-colors"
          />

          <div className="flex justify-between text-xs text-white/50">
            <span>{transcription.length} car.</span>
            <span>{transcription.length < 50 ? 'Ajoute plus de détails' : '✓ OK'}</span>
          </div>

          {transcription.length > 20 && (
            <button
              onClick={handleExtractClient}
              disabled={step === 'extracting'}
              className="text-sm text-orange-200 hover:text-orange-100 font-semibold disabled:opacity-50"
            >
              {step === 'extracting' ? 'Extraction…' : '↳ Pré-remplir les champs client depuis la dictée'}
            </button>
          )}
        </div>

        {/* Client */}
        <div className="spanc-card p-5 sm:p-6 space-y-3">
          <h2 className="text-xl font-black text-white">Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nom du client" value={clientNom} onChange={setClientNom} placeholder="M. Dupont / SAS Martin…" />
            <Field label="Adresse" value={clientAdresse} onChange={setClientAdresse} />
            <Field label="Code postal" value={clientCP} onChange={setClientCP} />
            <Field label="Ville" value={clientVille} onChange={setClientVille} />
            <Field label="Adresse du chantier" value={adresseChantier} onChange={setAdresseChantier} placeholder="idem / autre" />
            <label className="block text-sm">
              <span className="text-xs uppercase tracking-wide text-white/75">Date du devis</span>
              <input
                type="date"
                value={dateDevis}
                onChange={e => setDateDevis(e.target.value)}
                className="spanc-input text-sm.5 mt-1"
              />
            </label>
            <Field
              label="Référence dossier (optionnel)"
              value={referenceDossier}
              onChange={setReferenceDossier}
              placeholder="Rapport d'intervention du…"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-xl px-4 py-3 text-sm rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={transcription.trim().length < 20}
          className="w-full bg-[#0e2a52] hover:bg-[#13386e] disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-colors"
        >
          Générer le devis →
        </button>
      </main>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wide text-white/75">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="spanc-input text-sm.5 mt-1"
      />
    </label>
  )
}
