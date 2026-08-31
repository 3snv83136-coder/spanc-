'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  D302_ELEMENTS,
  calculIndiceD302,
  defaultServiceExercice,
  type ServiceExerciceANC,
} from '@/lib/types/sispea'
import { loadDossiers, statsConformiteDepuisDossiers } from '@/lib/sispea/dossiers'
import { loadSispeaConfig, saveSispeaConfig } from '@/lib/sispea/storage'
import { downloadSispeaCsv, generateSispeaCsv, validateSispeaExport } from '@/lib/sispea/csv-generator'

export default function SispeaPage() {
  const [config, setConfig] = useState<ServiceExerciceANC>(defaultServiceExercice())
  const [hydrated, setHydrated] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [nbDossiers, setNbDossiers] = useState(0)

  useEffect(() => {
    const loaded = loadSispeaConfig()
    const dossiers = loadDossiers()
    setNbDossiers(dossiers.length)
    if (loaded.autoCalculConformite !== false && dossiers.length > 0) {
      const stats = statsConformiteDepuisDossiers(dossiers)
      setConfig({ ...loaded, ...stats })
    } else {
      setConfig(loaded)
    }
    setHydrated(true)
  }, [])

  function patch<K extends keyof ServiceExerciceANC>(key: K, value: ServiceExerciceANC[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
    setExportDone(false)
  }

  function handleSave() {
    saveSispeaConfig(config)
    setSaved(true)
  }

  function handleRecalcFromDossiers() {
    const stats = statsConformiteDepuisDossiers(loadDossiers())
    setConfig(prev => ({ ...prev, ...stats, autoCalculConformite: true }))
    setSaved(false)
  }

  function handleExport() {
    setErrors([])
    setWarnings([])
    const validation = validateSispeaExport(config)
    setWarnings(validation.warnings)
    if (!validation.ok) {
      setErrors(validation.errors)
      return
    }
    const csv = generateSispeaCsv(config)
    downloadSispeaCsv(csv, config.annee)
    saveSispeaConfig(config)
    setExportDone(true)
    setSaved(true)
  }

  const indiceD302 = calculIndiceD302(config)
  const tauxConformite = config.nbInstallationsControleesTotal > 0
    ? ((config.nbInstallationsConformesTotal / config.nbInstallationsControleesTotal) * 100).toFixed(1)
    : '—'

  if (!hydrated) {
    return <div className="min-h-screen bg-[#0a1a3d]" />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white pb-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      <nav className="relative z-20 bg-[#0e2a52]/90 backdrop-blur-xl text-white px-4 py-3 sm:px-6 sm:py-4 shadow-lg ring-1 ring-white/10 sticky top-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm hover:opacity-80">
            <span className="text-xl">←</span>
            <div>
              <div className="font-black text-base sm:text-lg leading-tight">SPANC</div>
              <div className="text-[11px] opacity-70">Export SISPEA · RPQS ANC</div>
            </div>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-5 space-y-4">
        <section className="spanc-card p-5 space-y-2">
          <h1 className="text-2xl font-black text-white">Export SISPEA — compétence ANC</h1>
          <p className="text-sm text-white/70">
            Générez le fichier CSV à importer sur{' '}
            <a href="https://www.services.eaufrance.fr" target="_blank" rel="noopener noreferrer" className="text-orange-300 underline">
              services.eaufrance.fr
            </a>
            . SISPEA ne propose pas d&apos;API : l&apos;import se fait par dépôt de fichier.
          </p>
        </section>

        {/* Référentiel */}
        <section className="spanc-card p-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Référentiel SISPEA</h2>
          <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
            Un SERVICE_ID ou EQUIPEMENT_ID incorrect bloque tout l&apos;import. Vérifiez ces identifiants avec votre DDT/M avant le premier export.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SERVICE_ID *">
              <input
                value={config.serviceIdSispea}
                onChange={e => patch('serviceIdSispea', e.target.value)}
                placeholder="Identifiant SISPEA du service"
                className="spanc-input"
              />
            </Field>
            <Field label="EQUIPEMENT_ID *">
              <input
                value={config.equipementIdSispea}
                onChange={e => patch('equipementIdSispea', e.target.value)}
                placeholder="Identifiant SISPEA de l'ouvrage"
                className="spanc-input"
              />
            </Field>
            <Field label="Exercice (ANNEE) *">
              <input
                type="number"
                value={config.annee}
                onChange={e => patch('annee', parseInt(e.target.value, 10) || config.annee)}
                className="spanc-input"
              />
            </Field>
            <Field label="D301.0 — Habitants desservis">
              <input
                type="number"
                min={0}
                value={config.habitantsDesservis || ''}
                onChange={e => patch('habitantsDesservis', parseInt(e.target.value, 10) || 0)}
                className="spanc-input"
              />
            </Field>
          </div>
        </section>

        {/* D302 composantes */}
        <section className="spanc-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">D302.0 — Mise en œuvre ANC</h2>
            <span className="text-sm font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full">
              Indice estimé : {indiceD302}/140
            </span>
          </div>
          <p className="text-xs text-white/60">
            SISPEA recalcule D302.0 automatiquement à partir des 7 variables VP.168–VP.174 ci-dessous.
          </p>
          <ul className="space-y-2">
            {D302_ELEMENTS.map(el => (
              <li key={el.key}>
                <label className="flex items-start gap-3 p-3 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config[el.key]}
                    onChange={e => patch(el.key, e.target.checked)}
                    className="mt-1 h-4 w-4 rounded"
                  />
                  <span>
                    <span className="font-medium text-white">{el.label}</span>
                    <span className="block text-xs text-white/60">Partie {el.partie} · {el.points} pts</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* P301.3 */}
        <section className="spanc-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-white">P301.3 — Taux de conformité</h2>
            <span className="text-sm text-white/70">Taux estimé : <strong>{tauxConformite}%</strong></span>
          </div>
          <p className="text-xs text-white/60">
            Cumul depuis la création du SPANC. {nbDossiers} contrôle{nbDossiers > 1 ? 's' : ''} enregistré{nbDossiers > 1 ? 's' : ''} localement.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Installations contrôlées (total)">
              <input
                type="number"
                min={0}
                value={config.nbInstallationsControleesTotal}
                onChange={e => patch('nbInstallationsControleesTotal', parseInt(e.target.value, 10) || 0)}
                className="spanc-input"
              />
            </Field>
            <Field label="Installations conformes (total)">
              <input
                type="number"
                min={0}
                value={config.nbInstallationsConformesTotal}
                onChange={e => patch('nbInstallationsConformesTotal', parseInt(e.target.value, 10) || 0)}
                className="spanc-input"
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={handleRecalcFromDossiers}
            className="text-sm text-orange-300 hover:text-blue-800 font-semibold underline underline-offset-2"
          >
            Recalculer depuis les dossiers locaux ({nbDossiers})
          </button>
        </section>

        {errors.length > 0 && (
          <div className="text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-xl p-4 text-sm text-red-800 space-y-1">
            {errors.map(e => <div key={e}>• {e}</div>)}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-1">
            {warnings.map(w => <div key={w}>⚠ {w}</div>)}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-5 py-3 rounded-xl border-2 border-[#0e2a52] text-white font-bold hover:bg-slate-100"
          >
            Enregistrer les paramètres
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 px-5 py-3 rounded-xl bg-[#0e2a52] text-white font-bold hover:bg-[#0a2047]"
          >
            Télécharger le CSV SISPEA
          </button>
        </div>

        {saved && !exportDone && (
          <p className="text-sm text-emerald-700 text-center">Paramètres enregistrés.</p>
        )}

        {exportDone && (
          <section className="text-blue-200 bg-blue-500/10 ring-1 ring-blue-400/30 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-blue-200">Export généré</h3>
            <ol className="text-sm text-blue-100 space-y-2 list-decimal list-inside">
              <li>Connectez-vous sur <strong>services.eaufrance.fr</strong> → « Envoyer des données au site ».</li>
              <li>Importez le fichier <code className="bg-white/10 px-1 rounded text-orange-200">sispea-anc-spanc-sens-{config.annee}.csv</code>.</li>
              <li>Attendez le mail de confirmation SISPEA (erreurs = tout bloqué, avertissements = partiel).</li>
              <li className="font-semibold text-white">
                Récupérez l&apos;attestation de saisie sur SISPEA — obligatoire pour les aides des Agences de l&apos;eau.
              </li>
            </ol>
          </section>
        )}
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="spanc-label">{label}</span>
      {children}
    </label>
  )
}
