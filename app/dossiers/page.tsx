'use client'
import Link from "next/link"
import { useEffect, useState } from "react"
import SpancShell from "@/components/SpancShell"
import { loadDossiers, type DossierControle } from "@/lib/sispea/dossiers"
import { AVIS_LABELS, type AvisConformite } from "@/lib/types/spanc"
import { spanc } from "@/lib/spanc-ui"

export default function DossiersPage() {
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<DossierControle[]>([])

  useEffect(() => {
    setDrafts(loadDossiers())
  }, [])

  const filtered = drafts.filter(d => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const nom = `${d.usager?.prenom || ''} ${d.usager?.nom || ''}`.toLowerCase()
    const adresse = `${d.usager?.adresse || ''} ${d.usager?.commune || ''}`.toLowerCase()
    const cad = `${d.usager?.sectionCadastrale || ''} ${d.usager?.numeroParcelle || ''}`.toLowerCase()
    return nom.includes(q) || adresse.includes(q) || cad.includes(q) || (d.numeroRapport || '').toLowerCase().includes(q)
  })

  return (
    <SpancShell title="Dossiers usagers" subtitle="Recherche par adresse · Cadastre">
      <section className="spanc-card space-y-3">
        <h1 className={spanc.title}>Recherche dossier</h1>
        <p className={spanc.subtitle}>Recherche par nom, adresse, commune, parcelle cadastrale ou numéro de rapport.</p>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Ex : Dupont · 5 rue des Champs · AB 0042 · SPANC-2026-…"
          className={spanc.input}
        />
      </section>

      <section className="spanc-card mt-4">
        {drafts.length === 0 ? (
          <div className="space-y-3 py-10 text-center">
            <div className="text-5xl">📂</div>
            <h2 className={spanc.titleSm}>Aucun dossier enregistré</h2>
            <p className={`${spanc.subtitle} mx-auto max-w-md`}>
              Les contrôles validés depuis « Nouveau contrôle » sont enregistrés localement et alimentent l&apos;export SISPEA (P301.3).
            </p>
            <Link href="/nouveau" className={`${spanc.btnPrimary} inline-block mt-2`}>
              + Nouveau contrôle
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`py-8 text-center ${spanc.muted}`}>Aucun dossier ne correspond à « {search} ».</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {filtered.map((d, i) => (
              <li key={d.numeroRapport || i} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-bold text-white">{d.usager?.prenom} {d.usager?.nom}</div>
                  <div className="text-sm text-white/70">{d.usager?.adresse}, {d.usager?.commune}</div>
                  {(d.usager?.sectionCadastrale || d.usager?.numeroParcelle) && (
                    <div className="text-xs text-white/50">Cadastre : {d.usager?.sectionCadastrale} / {d.usager?.numeroParcelle}</div>
                  )}
                </div>
                <div className="text-right text-xs text-white/50">
                  <div className="font-mono">{d.numeroRapport}</div>
                  <div>{d.dateControle}</div>
                  {d.avisConformite && (
                    <div className="mt-1 font-semibold text-white/70">
                      {AVIS_LABELS[d.avisConformite as AvisConformite]?.icon}{' '}
                      {AVIS_LABELS[d.avisConformite as AvisConformite]?.short}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SpancShell>
  )
}
