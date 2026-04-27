'use client'
import Link from "next/link"
import { useEffect, useState } from "react"

interface DraftRapport {
  numeroRapport?: string
  typeControle?: string
  dateControle?: string
  usager?: { nom?: string; prenom?: string; commune?: string; adresse?: string; sectionCadastrale?: string; numeroParcelle?: string }
}

export default function DossiersPage() {
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<DraftRapport[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('spanc_dossiers')
      if (raw) setDrafts(JSON.parse(raw))
    } catch {}
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
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-[#0e2a52] text-white px-4 py-3 sm:px-6 sm:py-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm hover:opacity-80">
            <span className="text-xl">←</span>
            <div>
              <div className="font-black text-base sm:text-lg leading-tight">SPANC</div>
              <div className="text-[11px] opacity-70">Dossiers usagers</div>
            </div>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h1 className="text-2xl font-black text-[#0e2a52]">Recherche dossier</h1>
          <p className="text-sm text-slate-500">Recherche par nom, adresse, commune, parcelle cadastrale ou numéro de rapport.</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ex : Dupont · 5 rue des Champs · AB 0042 · SPANC-2026-…"
            className="w-full border-2 border-slate-200 focus:border-blue-500 outline-none rounded-xl px-4 py-3 text-base"
          />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          {drafts.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-5xl">📂</div>
              <h2 className="text-lg font-bold text-[#0e2a52]">Aucun dossier enregistré pour l&apos;instant</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                La persistance des dossiers (Supabase / base SPANC) n&apos;est pas encore branchée. Les rapports générés sont actuellement disponibles en téléchargement immédiat depuis l&apos;écran « Nouveau contrôle ».
              </p>
              <Link href="/nouveau" className="inline-block bg-[#0e2a52] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#0a2047] mt-2">
                + Nouveau contrôle
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Aucun dossier ne correspond à « {search} ».</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((d, i) => (
                <li key={d.numeroRapport || i} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#0e2a52]">{d.usager?.prenom} {d.usager?.nom}</div>
                    <div className="text-sm text-slate-600">{d.usager?.adresse}, {d.usager?.commune}</div>
                    {(d.usager?.sectionCadastrale || d.usager?.numeroParcelle) && (
                      <div className="text-xs text-slate-400">Cadastre : {d.usager?.sectionCadastrale} / {d.usager?.numeroParcelle}</div>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>{d.numeroRapport}</div>
                    <div>{d.dateControle}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
