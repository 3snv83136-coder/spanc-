// Types SISPEA — compétence ANC (RPQS)
// Voir docs/sispea-anc-export.md

/** Réglages du service SPANC pour un exercice (une ligne d'export). */
export interface ServiceExerciceANC {
  serviceIdSispea: string
  annee: number
  equipementIdSispea: string

  // D301.0
  habitantsDesservis: number

  // D302.0 — composantes VP.168 → VP.174 (booléens service)
  zonageDelibere: boolean
  reglementServiceDelibere: boolean
  controleConceptionExecutionNeuf: boolean
  diagnosticBonFonctionnement: boolean
  serviceEntretien: boolean
  serviceTravaux: boolean
  serviceTraitementMatieresVidange: boolean

  // P301.3 — variables sources (cumul depuis création du SPANC)
  nbInstallationsControleesTotal: number
  nbInstallationsConformesTotal: number

  /** Si true, les cumuls P301.3 sont recalculés depuis les dossiers locaux à l'export. */
  autoCalculConformite?: boolean
}

/** Mapping des colonnes CSV — à aligner sur le fichier modèle officiel SISPEA. */
export interface SispeaColumnMapping {
  serviceId: string
  annee: string
  equipementId: string
  habitantsDesservis: string
  zonageDelibere: string
  reglementServiceDelibere: string
  controleConceptionExecutionNeuf: string
  diagnosticBonFonctionnement: string
  serviceEntretien: string
  serviceTravaux: string
  serviceTraitementMatieresVidange: string
  nbInstallationsControlees: string
  nbInstallationsConformes: string
}

/** Mapping par défaut — à mettre à jour après téléchargement du modèle officiel. */
export const DEFAULT_SISPEA_COLUMNS: SispeaColumnMapping = {
  serviceId: 'SERVICE_ID',
  annee: 'ANNEE',
  equipementId: 'EQUIPEMENT_ID',
  habitantsDesservis: 'D301.0',
  zonageDelibere: 'VP.168',
  reglementServiceDelibere: 'VP.169',
  controleConceptionExecutionNeuf: 'VP.170',
  diagnosticBonFonctionnement: 'VP.171',
  serviceEntretien: 'VP.172',
  serviceTravaux: 'VP.173',
  serviceTraitementMatieresVidange: 'VP.174',
  // TODO : confirmer les codes VP officiels pour P301.3
  nbInstallationsControlees: 'VP.P301_CONTROLEES',
  nbInstallationsConformes: 'VP.P301_CONFORMES',
}

export const D302_ELEMENTS: {
  key: keyof Pick<
    ServiceExerciceANC,
  | 'zonageDelibere'
  | 'reglementServiceDelibere'
  | 'controleConceptionExecutionNeuf'
  | 'diagnosticBonFonctionnement'
  | 'serviceEntretien'
  | 'serviceTravaux'
  | 'serviceTraitementMatieresVidange'
  >
  label: string
  points: number
  partie: 'A' | 'B'
}[] = [
  { key: 'zonageDelibere', label: 'Délimitation des zones d\'ANC par délibération', points: 20, partie: 'A' },
  { key: 'reglementServiceDelibere', label: 'Règlement de service approuvé par délibération', points: 20, partie: 'A' },
  { key: 'controleConceptionExecutionNeuf', label: 'Contrôle conception ET exécution (< 8 ans)', points: 30, partie: 'A' },
  { key: 'diagnosticBonFonctionnement', label: 'Diagnostic bon fonctionnement et entretien', points: 30, partie: 'A' },
  { key: 'serviceEntretien', label: 'Service d\'entretien à la demande', points: 10, partie: 'B' },
  { key: 'serviceTravaux', label: 'Service de travaux à la demande', points: 20, partie: 'B' },
  { key: 'serviceTraitementMatieresVidange', label: 'Traitement des matières de vidange', points: 10, partie: 'B' },
]

export function calculIndiceD302(data: ServiceExerciceANC): number {
  const partieA = D302_ELEMENTS.filter(e => e.partie === 'A').every(e => data[e.key])
  if (!partieA) return D302_ELEMENTS.filter(e => e.partie === 'A' && data[e.key]).reduce((s, e) => s + e.points, 0)
  const base = 100
  const bonus = D302_ELEMENTS.filter(e => e.partie === 'B' && data[e.key]).reduce((s, e) => s + e.points, 0)
  return base + bonus
}

export function defaultServiceExercice(annee?: number): ServiceExerciceANC {
  return {
    serviceIdSispea: '',
    annee: annee ?? new Date().getFullYear() - 1,
    equipementIdSispea: '',
    habitantsDesservis: 0,
    zonageDelibere: true,
    reglementServiceDelibere: true,
    controleConceptionExecutionNeuf: true,
    diagnosticBonFonctionnement: true,
    serviceEntretien: false,
    serviceTravaux: false,
    serviceTraitementMatieresVidange: false,
    nbInstallationsControleesTotal: 0,
    nbInstallationsConformesTotal: 0,
    autoCalculConformite: true,
  }
}
