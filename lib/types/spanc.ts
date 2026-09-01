// Types métier SPANC — Service Public d'Assainissement Non Collectif
// Conforme aux arrêtés du 7 septembre 2009 et du 27 avril 2012

export type TypeControle =
  | 'conception'   // Contrôle de conception (installation neuve / réhabilitation)
  | 'execution'    // Contrôle d'exécution des travaux (tranchée ouverte)
  | 'periodique'   // Contrôle périodique de bon fonctionnement
  | 'vente'        // Diagnostic de vente immobilière

export type AvisConformite =
  | 'conforme'                          // ✅ aucune action requise
  | 'conforme_recommandations'          // 🟡 améliorations souhaitables
  | 'non_conforme'                      // ❌ travaux obligatoires (délai 4 ans)
  | 'non_conforme_risque_sanitaire'     // 🚨 urgence

export type TypePretraitement =
  | 'fosse_toutes_eaux'
  | 'fosse_septique'
  | 'bac_graisses'
  | 'micro_station'
  | 'toilettes_seches'

export type TypeTraitement =
  | 'tranchees_epandage'
  | 'filtre_sable_vertical'
  | 'filtre_compact'
  | 'tertre_filtrant'
  | 'phytoepuration'
  | 'micro_station_epuration'

export type TypeRejet =
  | 'infiltration_sol'
  | 'reseau_collectif'
  | 'cours_eau'
  | 'puits_infiltration'

export type StatutPointControle = 'conforme' | 'non_conforme' | 'non_verifie'

export interface UsagerSPANC {
  nom: string
  prenom: string
  adresse: string
  codePostal: string
  commune: string
  sectionCadastrale: string
  numeroParcelle: string
  email?: string
  telephone?: string
  nbPiecesPrincipales?: number
}

export interface FiliereSPANC {
  typePretraitement?: TypePretraitement | ''
  volumePretraitement?: number
  typeTraitement?: TypeTraitement | ''
  typeRejet?: TypeRejet | ''
  dateInstallation?: string
  niveauBoues?: number // 0-100 %
  derniereVidange?: string
}

export interface PointControle {
  key?: string
  label: string
  statut: StatutPointControle
  /** Photo constat terrain (contrôle périodique) */
  photoUrl?: string
}

export interface RapportSPANC {
  id: string
  numeroRapport: string                 // ex: SPANC-2026-1714234567890
  typeControle: TypeControle
  dateControle: string
  technicien: string
  usager: UsagerSPANC
  filiere: FiliereSPANC
  checkboxes: Record<string, boolean>
  dicteeText: string
  constatTechnique: string
  pointsControles: PointControle[]
  evaluationConformite: string
  prescriptions: string[]
  observationsTechnicien: string
  avisConformite: AvisConformite
  prochaineEcheance: string             // ex: "10 ans", "4 ans", "1 an"
  photos: string[]                      // URLs ou data URLs
  /** Photo de la façade / du bien contrôlé */
  photoMaison?: string
  pdfUrl?: string
  envoye?: boolean
  dateEnvoi?: string
}

// ============ Helpers / Labels ============

export const TYPE_CONTROLE_LABELS: Record<TypeControle, { label: string; icon: string; desc: string }> = {
  conception: {
    label: 'Contrôle de conception',
    icon: '🏗️',
    desc: 'Installation neuve / réhabilitation',
  },
  execution: {
    label: "Contrôle d'exécution",
    icon: '🔨',
    desc: 'Tranchée ouverte — travaux',
  },
  periodique: {
    label: 'Contrôle périodique',
    icon: '🔄',
    desc: 'Bon fonctionnement',
  },
  vente: {
    label: 'Diagnostic de vente',
    icon: '🏠',
    desc: 'Transaction immobilière',
  },
}

export const AVIS_LABELS: Record<AvisConformite, { label: string; short: string; icon: string; tone: string }> = {
  conforme: {
    label: 'Conforme — aucune action requise',
    short: 'Conforme',
    icon: '✅',
    tone: 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100',
  },
  conforme_recommandations: {
    label: 'Conforme avec recommandations',
    short: 'Conforme + recommandations',
    icon: '🟡',
    tone: 'border-amber-400/70 bg-amber-500/20 text-amber-100',
  },
  non_conforme: {
    label: 'Non conforme — travaux obligatoires (délai 4 ans)',
    short: 'Non conforme',
    icon: '❌',
    tone: 'border-red-400/70 bg-red-500/20 text-red-100',
  },
  non_conforme_risque_sanitaire: {
    label: 'Non conforme — risque sanitaire (urgence)',
    short: 'Risque sanitaire',
    icon: '🚨',
    tone: 'border-red-500/70 bg-red-600/25 text-white',
  },
}

export const PRETRAITEMENT_LABELS: Record<TypePretraitement, string> = {
  fosse_toutes_eaux: 'Fosse toutes eaux',
  fosse_septique: 'Fosse septique',
  bac_graisses: 'Bac à graisses',
  micro_station: 'Micro-station',
  toilettes_seches: 'Toilettes sèches',
}

export const TRAITEMENT_LABELS: Record<TypeTraitement, string> = {
  tranchees_epandage: "Tranchées d'épandage",
  filtre_sable_vertical: 'Filtre à sable vertical',
  filtre_compact: 'Filtre compact',
  tertre_filtrant: 'Tertre filtrant',
  phytoepuration: 'Phytoépuration',
  micro_station_epuration: "Micro-station d'épuration",
}

export const REJET_LABELS: Record<TypeRejet, string> = {
  infiltration_sol: 'Infiltration dans le sol',
  reseau_collectif: 'Réseau collectif (eaux pluviales)',
  cours_eau: "Cours d'eau",
  puits_infiltration: "Puits d'infiltration",
}

// Délai standard avant prochain contrôle selon avis
export function prochaineEcheanceParDefaut(avis: AvisConformite, type: TypeControle): string {
  if (type === 'vente') return '3 ans'
  switch (avis) {
    case 'conforme': return '10 ans'
    case 'conforme_recommandations': return '10 ans'
    case 'non_conforme': return '4 ans'
    case 'non_conforme_risque_sanitaire': return '1 an'
  }
}

// Génère un numéro de rapport unique : SPANC-{YYYY}-{timestamp}
export function genererNumeroRapport(date: Date = new Date()): string {
  return `SPANC-${date.getFullYear()}-${date.getTime()}`
}

// Liste des points de contrôle standards (utilisés en checklist + rapport)
// Points 1-8 : contrôle courant de bon fonctionnement.
// Points 9-14 : critères de classement de l'Annexe II de l'arrêté du 27 avril 2012
// (défaut de sécurité sanitaire / défaut de structure / distance puits / installation
// incomplète ou sous-dimensionnée / zone à enjeu) — ce sont eux qui déclenchent un avis
// "non conforme" ou "danger pour la santé des personnes" dans le tableau de classement officiel.
export const POINTS_CONTROLES_STANDARDS: { key: string; label: string }[] = [
  { key: 'regard_accessible', label: 'Regard accessible au niveau du sol' },
  { key: 'ventilation_primaire', label: 'Ventilation primaire présente et fonctionnelle' },
  { key: 'ventilation_secondaire', label: 'Ventilation secondaire présente' },
  { key: 'vidange_recente', label: 'Dernière vidange < 4 ans (facture fournie)' },
  { key: 'absence_ecoulement', label: "Absence d'écoulement superficiel" },
  { key: 'absence_odeurs', label: "Absence d'odeurs anormales constatées ou signalées" },
  { key: 'absence_retour', label: 'Absence de retour en surface' },
  { key: 'distance_captages', label: 'Distance puits privé > 35 m (amont hydraulique) respectée' },
  { key: 'absence_contact_eaux_usees', label: 'Absence de contact possible avec les eaux usées (sur ou hors parcelle)' },
  { key: 'securite_structure_ouvrages', label: 'Ouvrages fermés et sécurisés (couvercles, absence de risque électrique)' },
  { key: 'installation_complete', label: "Installation complète (prétraitement + traitement, pas de rejet d'eaux brutes)" },
  { key: 'dimensionnement_suffisant', label: 'Dimensionnement suffisant (capacité ≥ moitié du flux de pollution à traiter)' },
  { key: 'absence_dysfonctionnement_majeur', label: 'Absence de dysfonctionnement majeur (prétraitement dégradé, drains engorgés, micro-station défaillante)' },
  { key: 'hors_zone_enjeu', label: "Hors zone à enjeu sanitaire (captage AEP, baignade) ou environnemental (zone conchylicole)" },
]
