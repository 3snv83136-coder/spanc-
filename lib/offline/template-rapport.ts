import {
  AVIS_LABELS,
  POINTS_CONTROLES_STANDARDS,
  PRETRAITEMENT_LABELS,
  REJET_LABELS,
  TRAITEMENT_LABELS,
  TYPE_CONTROLE_LABELS,
  genererNumeroRapport,
  prochaineEcheanceParDefaut,
  type AvisConformite,
  type FiliereSPANC,
  type RapportSPANC,
  type StatutPointControle,
  type TypeControle,
  type UsagerSPANC,
} from '@/lib/types/spanc'

function filiereDescription(f: FiliereSPANC, niveauBoues?: number): string {
  const lines = [
    f.typePretraitement && PRETRAITEMENT_LABELS[f.typePretraitement],
    f.volumePretraitement && `${f.volumePretraitement} m³`,
    f.typeTraitement && TRAITEMENT_LABELS[f.typeTraitement],
    f.typeRejet && REJET_LABELS[f.typeRejet],
    f.dateInstallation && `installée en ${f.dateInstallation}`,
    f.derniereVidange && `dernière vidange : ${f.derniereVidange}`,
    typeof niveauBoues === 'number' && `niveau de boues : ${niveauBoues} %`,
  ].filter(Boolean)
  return lines.length ? lines.join(' · ') : 'non renseignée'
}

export function buildOfflineRapport(params: {
  typeControle: TypeControle
  usager: UsagerSPANC
  filiere: FiliereSPANC
  dictee: string
  checkboxes: Record<string, boolean>
  niveauBoues: number
  avisAgent: AvisConformite
  technicien: string
  dateControle: string
  photos: string[]
  photoMaison?: string
  pointsTerrain?: Record<string, { statut: StatutPointControle; photoUrl?: string }>
}): RapportSPANC {
  const numeroRapport = genererNumeroRapport()
  const typeMeta = TYPE_CONTROLE_LABELS[params.typeControle]
  const avis = params.avisAgent
  const prochaineEcheance = prochaineEcheanceParDefaut(avis, params.typeControle)

  const pointsControles = POINTS_CONTROLES_STANDARDS.map(p => {
    const terrain = params.pointsTerrain?.[p.key]
    const statut = terrain?.statut ?? (params.checkboxes[p.key] ? 'conforme' as const : 'non_verifie' as const)
    return {
      key: p.key,
      label: p.label,
      statut,
      photoUrl: terrain?.photoUrl,
    }
  })

  const adresse = `${params.usager.adresse}, ${params.usager.codePostal} ${params.usager.commune}`.trim()
  const filiere = filiereDescription(params.filiere, params.niveauBoues)

  const constatTechnique = [
    `${typeMeta.label} réalisé le ${params.dateControle.split('-').reverse().join('/')} par ${params.technicien}.`,
    `Usager : ${params.usager.prenom} ${params.usager.nom} — ${adresse}.`,
    params.usager.sectionCadastrale && `Cadastre : section ${params.usager.sectionCadastrale}, parcelle ${params.usager.numeroParcelle || '—'}.`,
    `Filière ANC : ${filiere}.`,
    '',
    'Constat terrain (dictée) :',
    params.dictee.trim(),
    '',
    '— Rapport provisoire généré hors connexion. Une synthèse IA sera appliquée à la synchronisation.',
  ].filter(Boolean).join('\n')

  const evaluationConformite = [
    `Avis provisoire du technicien : ${AVIS_LABELS[avis].label}.`,
    'Évaluation détaillée et prescriptions seront complétées lors de la synchronisation avec le serveur SPANC.',
  ].join(' ')

  const prescriptions: string[] = []
  if (avis === 'non_conforme' || avis === 'non_conforme_risque_sanitaire') {
    prescriptions.push('Mise en conformité de l\'installation — prescriptions détaillées à finaliser après synchronisation.')
  }

  return {
    id: numeroRapport,
    numeroRapport,
    typeControle: params.typeControle,
    dateControle: params.dateControle,
    technicien: params.technicien,
    usager: params.usager,
    filiere: params.filiere,
    checkboxes: params.checkboxes,
    dicteeText: params.dictee,
    constatTechnique,
    pointsControles,
    evaluationConformite,
    prescriptions,
    observationsTechnicien: 'Rapport terrain hors ligne — enrichissement IA en attente.',
    avisConformite: avis,
    prochaineEcheance,
    photos: params.photos,
    photoMaison: params.photoMaison,
  }
}
