import {
  DEFAULT_SISPEA_COLUMNS,
  type ServiceExerciceANC,
  type SispeaColumnMapping,
} from '@/lib/types/sispea'

function boolToSispea(v: boolean): string {
  return v ? 'Oui' : 'Non'
}

function escapeCsvCell(value: string | number): string {
  const s = String(value)
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export interface CsvValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export function validateSispeaExport(data: ServiceExerciceANC): CsvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data.serviceIdSispea.trim()) errors.push('SERVICE_ID manquant')
  if (!data.equipementIdSispea.trim()) errors.push('EQUIPEMENT_ID manquant')
  if (!Number.isInteger(data.habitantsDesservis)) errors.push('D301.0 doit être un entier')
  if (data.nbInstallationsControleesTotal < 0) errors.push('Nombre de contrôles invalide')
  if (data.nbInstallationsConformesTotal > data.nbInstallationsControleesTotal) {
    errors.push('Conformes > contrôlées')
  }

  if (DEFAULT_SISPEA_COLUMNS.nbInstallationsControlees.startsWith('VP.P301')
    || DEFAULT_SISPEA_COLUMNS.nbInstallationsConformes.startsWith('VP.P301')) {
    warnings.push(
      'Les codes VP pour P301.3 sont provisoires — alignez-les sur le fichier modèle officiel SISPEA avant import.',
    )
  }

  return { ok: errors.length === 0, errors, warnings }
}

/**
 * Génère un CSV SISPEA (; UTF-8) avec uniquement les colonnes à écrire.
 * N'inclut PAS D302.0 ni P301.3 (auto-calculés par SISPEA).
 */
export function generateSispeaCsv(
  data: ServiceExerciceANC,
  columns: SispeaColumnMapping = DEFAULT_SISPEA_COLUMNS,
): string {
  const row: Record<string, string | number> = {
    [columns.serviceId]: data.serviceIdSispea.trim(),
    [columns.annee]: data.annee,
    [columns.equipementId]: data.equipementIdSispea.trim(),
    [columns.habitantsDesservis]: Math.round(data.habitantsDesservis),
    [columns.zonageDelibere]: boolToSispea(data.zonageDelibere),
    [columns.reglementServiceDelibere]: boolToSispea(data.reglementServiceDelibere),
    [columns.controleConceptionExecutionNeuf]: boolToSispea(data.controleConceptionExecutionNeuf),
    [columns.diagnosticBonFonctionnement]: boolToSispea(data.diagnosticBonFonctionnement),
    [columns.serviceEntretien]: boolToSispea(data.serviceEntretien),
    [columns.serviceTravaux]: boolToSispea(data.serviceTravaux),
    [columns.serviceTraitementMatieresVidange]: boolToSispea(data.serviceTraitementMatieresVidange),
    [columns.nbInstallationsControlees]: Math.round(data.nbInstallationsControleesTotal),
    [columns.nbInstallationsConformes]: Math.round(data.nbInstallationsConformesTotal),
  }

  const headers = Object.keys(row)
  const values = headers.map(h => escapeCsvCell(row[h]))
  return `${headers.join(';')}\n${values.join(';')}\n`
}

export function downloadSispeaCsv(csv: string, annee: number): void {
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sispea-anc-spanc-sens-${annee}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
