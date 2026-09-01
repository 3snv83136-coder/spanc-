'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { RAPPORT_DEMO_META, RAPPORT_DEMO_PILLU } from '@/lib/demo/rapport-pillu-exemple'
import { AVIS_LABELS, TYPE_CONTROLE_LABELS } from '@/lib/types/spanc'

const RapportPDFPreviewModal = dynamic(() => import('@/components/RapportPDFPreviewModal'), { ssr: false })
const RapportSPANCDownloadButton = dynamic(() => import('@/components/RapportSPANCPDF'), { ssr: false })

export default function ApercuRapportPage() {
  const [mounted, setMounted] = useState(false)
  const [showPdf, setShowPdf] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const rapport = RAPPORT_DEMO_PILLU
  const meta = RAPPORT_DEMO_META
  const avis = AVIS_LABELS[rapport.avisConformite]
  const type = TYPE_CONTROLE_LABELS[rapport.typeControle]

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0a1a3d] flex items-center justify-center text-white/60">
        Chargement de l&apos;aperçu…
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      <div className="absolute top-10 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 border-b border-white/10 bg-[#0e2a52]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="SPANC Sens" className="h-10 w-auto" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-orange-300/90 font-bold">Validation client</div>
              <div className="font-black text-sm sm:text-base">Aperçu rapport diagnostic</div>
            </div>
          </div>
          <Link href="/" className="text-xs text-white/50 hover:text-white underline shrink-0 hidden sm:block">
            Accueil agent
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Bandeau explicatif */}
        <section className="rounded-3xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent ring-1 ring-orange-400/30 p-6 sm:p-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-100">
            Document de démonstration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            {meta.titre}
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Ce visuel reproduit le <strong className="text-white">rendu PDF actuel du logiciel SPANC Sens</strong>,
            à partir des données de votre diagnostic Word officiel (dossier {meta.reference}).
            Merci de nous indiquer si la mise en page, les couleurs et la lisibilité vous conviennent.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Fiche résumé */}
          <section className="lg:col-span-2 space-y-4">
            <div className="spanc-card space-y-4">
              <h2 className="font-black text-lg uppercase tracking-wide text-orange-200">Dossier exemple</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-white/45">Référence</dt>
                  <dd className="font-mono font-bold text-orange-200">{meta.reference}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-white/45">Usager</dt>
                  <dd className="font-semibold">{meta.client}</dd>
                  <dd className="text-white/65 text-xs mt-0.5">{meta.adresse}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-white/45">Date & type</dt>
                  <dd>{meta.date} — {type.label}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-white/45">Technicien</dt>
                  <dd>{rapport.technicien}</dd>
                </div>
              </dl>

              <div className={`rounded-xl p-4 ring-1 ${avis.tone}`}>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80">Avis de conformité</div>
                <div className="text-lg font-black mt-1">{avis.icon} {avis.label}</div>
                <div className="text-sm mt-1 opacity-90">Prochain contrôle : {rapport.prochaineEcheance}</div>
              </div>
            </div>

            <div className="spanc-card text-sm text-white/75 space-y-2">
              <h3 className="font-bold text-white text-base">Points à valider avec nous</h3>
              <ul className="space-y-2 list-none">
                {[
                  'En-tête et identité visuelle SPANC (teal Grand Sénonais)',
                  'Containers colorés par section (identification, filière, constat…)',
                  'Photo du bien sur la page identification',
                  'Photos par point de contrôle (contrôle périodique)',
                  'Chapitres sur pages séparées — sans coupure',
                ].map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="text-orange-400">◆</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Aperçu visuel mock + actions */}
          <section className="lg:col-span-3 space-y-4">
            <div
              className="rounded-3xl bg-white text-[#1a1f2e] shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/20 cursor-pointer group flex"
              onClick={() => setShowPdf(true)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setShowPdf(true)}
            >
              <div className="w-1.5 bg-[#007B7F] shrink-0" />
              <div className="flex-1 min-w-0">
              <div className="bg-[#007B7F] px-5 py-3 flex justify-between items-end text-white text-[10px] border-b-[3px] border-[#f97316]">
                <div>
                  <div className="font-bold uppercase tracking-wide">SPANC · Grand Sénonais</div>
                  <div className="text-teal-100/80 text-[9px]">Service Public d&apos;ANC</div>
                </div>
                <div className="text-right text-[9px] opacity-80">03 86 83 12 88</div>
              </div>
              <div className="p-4 space-y-3 bg-white min-h-[300px]">
                <div className="flex rounded-lg overflow-hidden border-2 border-[#007B7F]/30 text-[9px]">
                  <div className="w-[34%] bg-[#1A3351] text-white p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[#7dd3d6] uppercase tracking-wider text-[7px]">N° rapport</div>
                      <div className="font-bold mt-1">{rapport.numeroRapport}</div>
                    </div>
                    <div className="text-teal-200/70">06/08/2026</div>
                  </div>
                  <div className="flex-1 bg-[#e6f7f7] p-2.5">
                    <div className="text-[#007B7F] font-bold uppercase tracking-widest text-[7px]">Rapport officiel</div>
                    <div className="font-black text-[#1A3351] uppercase text-sm mt-1">Diagnostic ANC</div>
                    <div className="text-[#007B7F] font-bold mt-0.5">{type.label}</div>
                  </div>
                </div>
                <div className="flex rounded-lg overflow-hidden border-2 border-emerald-300">
                  <div className="w-2 bg-emerald-600" />
                  <div className="flex-1 bg-emerald-50 p-2.5 text-[10px]">
                    <span className="bg-emerald-600 text-white text-[7px] font-bold uppercase px-2 py-0.5 rounded-full">✅ Conforme</span>
                    <div className="font-bold mt-1">Installation conforme</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#f97316] text-white text-[8px] font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
                  <span className="bg-[#007B7F] text-white text-[8px] font-bold uppercase flex-1 py-1.5 px-2 rounded">Identification & photo du bien</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-[8px]">
                  <div className="col-span-3 space-y-1">
                    <div className="bg-[#b8e8ea] border-2 border-[#007B7F] rounded p-1.5">
                      <div className="text-[#005f63] font-bold uppercase text-[6px]">Propriétaire</div>
                      <div className="font-bold">Marc PILLU</div>
                    </div>
                    <div className="bg-[#c7d9f0] border-2 border-[#1A3351] rounded p-1.5">
                      <div className="text-[#1A3351] font-bold uppercase text-[6px]">Adresse</div>
                      <div className="font-bold leading-tight">1 Chemin des Accins — 89500 Villeneuve-sur-Yonne</div>
                    </div>
                  </div>
                  {rapport.photoMaison && (
                    <div className="col-span-2 rounded overflow-hidden border-2 border-[#007B7F]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rapport.photoMaison} alt="" className="w-full h-16 object-cover" />
                      <div className="bg-[#1A3351] text-white text-[6px] text-center py-0.5 font-bold">Photo du bien</div>
                    </div>
                  )}
                </div>
                <div className="text-[8px] text-[#64748b] line-clamp-2 leading-relaxed bg-[#ddd6fe] border-2 border-[#7c3aed] rounded p-2">
                  {rapport.constatTechnique.slice(0, 160)}…
                </div>
              </div>
              <div className="bg-[#e6f7f7] border-t-2 border-[#007B7F]/30 py-3 text-center group-hover:bg-[#b8e8ea] transition-colors">
                <span className="text-sm font-bold text-[#1A3351] group-hover:text-[#007B7F]">
                  Cliquez pour ouvrir l&apos;aperçu PDF complet →
                </span>
              </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowPdf(true)}
                className="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 py-4 font-black text-[#0a1a3d] shadow-lg shadow-orange-500/30 hover:brightness-105 transition"
              >
                👁 Voir le PDF en plein écran
              </button>
              <RapportSPANCDownloadButton
                rapport={rapport}
                filename={`apercu-${rapport.numeroRapport}.pdf`}
                label="📥 Télécharger l'aperçu"
                className="flex-1 rounded-2xl bg-[#0e2a52] hover:bg-[#0a2047] text-white py-4 font-bold text-center"
              />
            </div>

            <p className="text-xs text-white/45 text-center leading-relaxed">
              Lien à transmettre à votre client pour validation esthétique · Données fictives issues du modèle Word {meta.reference}
            </p>
          </section>
        </div>
      </div>

      <RapportPDFPreviewModal
        open={showPdf}
        onClose={() => setShowPdf(false)}
        rapport={rapport}
      />
    </main>
  )
}
