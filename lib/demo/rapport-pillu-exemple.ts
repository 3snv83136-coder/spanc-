import {
  POINTS_CONTROLES_STANDARDS,
  type RapportSPANC,
} from '@/lib/types/spanc'

/**
 * Exemple réaliste calqué sur le diagnostic Word officiel
 * 89464-DG-2026-0206 — Villeneuve-sur-Yonne (août 2026)
 */
export const RAPPORT_DEMO_PILLU: RapportSPANC = {
  id: 'demo-pillu-0206',
  numeroRapport: '89464-DG-2026-0206',
  typeControle: 'vente',
  dateControle: '2026-08-06',
  technicien: 'Sacha GAUDÉ',
  usager: {
    nom: 'PILLU',
    prenom: 'Marc',
    adresse: '1 Chemin des Accins — Hameau de Talouan',
    codePostal: '89500',
    commune: 'Villeneuve-sur-Yonne',
    sectionCadastrale: 'AC',
    numeroParcelle: '124',
    email: 'exemple@client.fr',
    telephone: '06 00 00 00 00',
    nbPiecesPrincipales: 5,
  },
  filiere: {
    typePretraitement: 'fosse_toutes_eaux',
    volumePretraitement: 3,
    typeTraitement: 'filtre_sable_vertical',
    typeRejet: 'infiltration_sol',
    dateInstallation: 'Années 1990 (estimation)',
    niveauBoues: 35,
    derniereVidange: 'Jamais effectuée (déclaratif propriétaire)',
  },
  checkboxes: {},
  dicteeText: '',
  constatTechnique: `L'installation d'assainissement non collectif comprend une fosse toutes eaux d'environ 3 m³ et un dispositif de traitement secondaire par infiltration d'environ 20 m², implanté à moins de 45 cm de profondeur sous un terrain herbeux.

La collecte des eaux usées domestiques est assurée par des canalisations enterrées. Les regards de visite ont pu être ouverts le jour du contrôle. Aucun écoulement superficiel ni odeur anormale n'a été constaté à proximité des ouvrages.

Le niveau de boues dans la fosse reste modéré compte tenu de la faible occupation du logement (2 personnes permanentes pour une installation dimensionnée à 6 équivalents-habitants). Aucune vidange n'a été réalisée à ce jour selon les déclarations du propriétaire.

Le massif d'infiltration est accessible. Absence de circulation de véhicules sur la zone d'épandage. Distance supérieure à 35 m d'un captage d'eau potable connue sur la parcelle voisine.`,
  pointsControles: POINTS_CONTROLES_STANDARDS.map((p, i) => {
    const nonConformes = new Set(['vidange_recente'])
    const nonVerifies = new Set<string>()
    return {
      label: p.label,
      statut: nonConformes.has(p.key)
        ? 'non_conforme' as const
        : nonVerifies.has(p.key)
          ? 'non_verifie' as const
          : 'conforme' as const,
    }
  }),
  evaluationConformite: `Au regard des éléments constatés lors de la visite, l'installation ne présente pas de dysfonctionnement majeur au sens de l'arrêté du 27 avril 2012.

La conformité de l'installation est retenue au titre : « Installation ne présentant pas de défaut ».

Compte tenu de la faible occupation de l'habitation (2 personnes pour une installation dimensionnée à 6 EH), la nécessité d'une vidange régulière n'a peut-être pas été perçue par les usagers. Il est toutefois rappelé que l'entretien de la fosse toutes eaux doit être réalisé dès que les boues atteignent 50 % du volume utile, ou au maximum tous les 4 ans.

Ce rapport n'est valable que dans son ensemble ; la conclusion ne pouvant être détachée des observations qui la fondent.`,
  prescriptions: [
    'Programmer une première vidange de la fosse toutes eaux par un vidangeur agréé et conserver le bordereau de vidange.',
    'Maintenir les regards de visite accessibles au niveau du sol pour faciliter les contrôles ultérieurs.',
    'Transmettre au SPANC tout justificatif d\'entretien (vidange, curage) pour archivage au dossier usager.',
  ],
  observationsTechnicien: `Habitation principale occupée par 2 personnes. Terrain herbeux, pente modérée. Usagers coopératifs lors de la visite. Aucun dysfonctionnement constaté nécessitant une mise en conformité immédiate.`,
  avisConformite: 'conforme',
  prochaineEcheance: '3 ans',
  photos: [],
}

export const RAPPORT_DEMO_META = {
  titre: 'Rapport de diagnostic ANC — Exemple client',
  sousTitre: 'Aperçu esthétique généré par le logiciel SPANC Sens',
  reference: '89464-DG-2026-0206',
  client: 'M. Marc PILLU',
  adresse: '1 Chemin des Accins, 89500 Villeneuve-sur-Yonne',
  date: '6 août 2026',
  objet: 'Diagnostic de bon fonctionnement — vente immobilière',
}
