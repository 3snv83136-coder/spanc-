export interface RedactionPhrase {
  id: string
  label: string
  text: string
}

export interface RedactionSection {
  id: string
  title: string
  phrases: RedactionPhrase[]
}

export interface RedactionPart {
  id: string
  title: string
  sections: RedactionSection[]
}

function p(id: string, label: string, text: string): RedactionPhrase {
  return { id, label, text }
}

export const REDACTION_AIDE_SPANC: RedactionPart[] = [
  {
    id: 'p1',
    title: '1 — Collecte et évacuation des eaux brutes',
    sections: [
      {
        id: 'p1-1',
        title: '1.1 Absence ou inaccessibilité des regards',
        phrases: [
          p('p1-1-1', 'Absence de regards extérieurs', "Absence de regards de collecte extérieurs. Aucune intervention d'entretien ne pourra être effectuée en cas de problème sur les canalisations d'évacuation des eaux usées."),
          p('p1-1-2', 'Regards inaccessibles', "Aucun regard de visite extérieur n'a pu être contrôlé le jour du contrôle, ceux-ci pouvant être absents ou rendus inaccessibles. Cette situation ne permet pas d'assurer l'accès aux canalisations pour les opérations de contrôle, d'entretien ou d'éventuelles interventions en cas de dysfonctionnement."),
          p('p1-1-3', 'Absence d\'eau', "L'absence d'alimentation en eau n'a pas permis de vérifier le bon écoulement des eaux à travers les ouvrages. Aucun test d'écoulement d'eau n'a pu être réalisé lors du contrôle."),
        ],
      },
      {
        id: 'p1-2',
        title: '1.2 Non-dissociation EP / EU',
        phrases: [
          p('p1-2-1', 'Mélange EP/EU', "Les eaux pluviales ne sont pas dissociées du système d'assainissement."),
          p('p1-2-2', 'Rejet vers puisards', "L'ensemble des eaux usées de l'habitation est dirigé vers deux puisards."),
        ],
      },
      {
        id: 'p1-3',
        title: '1.3 Raccordements spécifiques',
        phrases: [
          p('p1-3-1', 'Siphon/bonde garage', "Toutes les eaux issues d'un siphon ou bonde intérieur (qui ne reçoit pas d'eaux pluviales) doivent être raccordées aux eaux usées."),
          p('p1-3-2', 'Robinets extérieurs', "Les eaux issues de robinets extérieurs possédant une vasque peuvent être rejetées dans le réseau d'eaux usées. Les eaux issues de robinets extérieurs sans vasque peuvent être infiltrées à la parcelle par ruissellement ou dans un puisard. Dans ce cas, le robinet extérieur ne doit être utilisé que pour l'arrosage ou toute autre activité n'entraînant pas de rejet de peintures, d'huiles, de graisses ou d'éléments lessiviels."),
        ],
      },
      {
        id: 'p1-4',
        title: '1.4 Dysfonctionnements de collecte',
        phrases: [
          p('p1-4-1', 'Difficulté d\'écoulement', "Des difficultés d'écoulement des eaux usées de la propriété ont été constatées. Il convient de rechercher les causes de ce dysfonctionnement. Le curage des canalisations, éventuellement couplé à une inspection télévisée, est dans un premier temps préconisé."),
          p('p1-4-2', 'Dépendance entretien vidangeur', "D'éventuels travaux de reprise des défauts sur les canalisations d'évacuation des eaux usées seront fonction des résultats obtenus suite à l'intervention d'un vidangeur agréé."),
        ],
      },
    ],
  },
  {
    id: 'p2',
    title: '2 — Traitement primaire (fosse / bac à graisses)',
    sections: [
      {
        id: 'p2-1',
        title: '2.1 Absence ou inaccessibilité',
        phrases: [
          p('p2-1-1', 'Absence totale primaire', "Pas d'éléments probants attestant l'existence d'un dispositif de traitement primaire présent sur la parcelle."),
          p('p2-1-2', 'Absence EM', 'Absence de traitement primaire pour les eaux ménagères.'),
          p('p2-1-3', 'Fosse inaccessible', "Une fosse toutes eaux serait présente selon le dernier rapport en date du [Date]. Toutefois, celle-ci n'était pas accessible le jour du contrôle, rendant impossible la vérification de son état de fonctionnement ainsi que de son état structurel."),
          p('p2-1-4', 'Absence écoulement EM', "Absence d'écoulement des eaux ménagères de la cuisine constaté lors du contrôle."),
        ],
      },
      {
        id: 'p2-2',
        title: '2.2 Défauts de ventilation',
        phrases: [
          p('p2-2-1', 'Ventilation non conforme', "Absence de ventilations ou ventilations non conformes à la réglementation en vigueur (Arrêté du 7 septembre 2009 / DTU 64.1). La fosse toutes eaux génère des gaz de fermentation qui doivent être évacués. Prescription : La ventilation doit être constituée d'une entrée d'air et d'une sortie d'air, située en hauteur, d'un diamètre d'au moins 100 mm, distantes d'au moins 1 mètre.\nEntrée d'air : assurée par la canalisation de chute des eaux usées prolongée en ventilation primaire (100 mm min.) jusqu'à l'air libre, à l'extérieur et au-dessus des locaux habités.\nSortie d'air : les gaz doivent être évacués par un extracteur statique ou éolien situé à minima 0,40 m au-dessus du faîtage et à au moins 1 m de tout ouvrant. Le tracé doit être rectiligne, sans contre-pente, avec des coudes ≤ 45°."),
        ],
      },
      {
        id: 'p2-3',
        title: '2.3 Entretien et état structurel',
        phrases: [
          p('p2-3-1', 'Absence justificatifs', "Absence de documents attestant d'un entretien des ouvrages d'assainissement. Aucun justificatif de vidange de la fosse n'a été présenté lors du contrôle. La capacité de l'ouvrage n'a pas pu être déterminée."),
          p('p2-3-2', 'Couvercles défectueux', "Les couvercles de la fosse toutes eaux sont corrodés et fissurés. Cela représente un danger pour la santé des personnes (risque de chute et contact direct avec les effluents). Ils devront être remplacés et la ventilation secondaire devra être mise aux normes."),
          p('p2-3-3', 'Bac à graisses inefficace', "Les eaux ménagères ne sont pas prétraitées correctement, le bac à graisse ne retient pas les matières. Ce dispositif n'est pas réglementaire."),
          p('p2-3-4', 'Confusion regard / bac à graisse', "Absence de traitement primaire pour les eaux ménagères. Le regard de décantation n'a pas la fonction de bac à graisse. La contenance minimale pour un bac à graisse est de 200 L pour les eaux ménagères provenant de la cuisine et 500 L pour l'ensemble des eaux ménagères."),
          p('p2-3-5', 'Curage complet', "Faire réaliser un curage et un pompage complets de l'ensemble de l'installation par une entreprise spécialisée. Les matières de vidange devront être évacuées vers une filière de traitement agréée. À l'issue de l'intervention, remettre l'installation en eau claire."),
        ],
      },
      {
        id: 'p2-4',
        title: '2.4 Sous-dimensionnement',
        phrases: [
          p('p2-4-1', 'Sous-dimensionnement', 'Le traitement primaire est non adapté au flux de pollution à traiter dans un rapport de 1 à 2. Celui-ci est sous dimensionné.'),
          p('p2-4-2', 'Règle dimensionnement fosse', "Le volume minimum d'une fosse toutes eaux est de 3 m3 (3 000 litres) pour une maison comprenant jusqu'à 5 pièces principales. La fosse toutes eaux préconisée pour cette installation est de 3m3. Son entretien devra être réalisé tous les 3 ans si le nombre d'habitants dépasse 4 personnes."),
        ],
      },
    ],
  },
  {
    id: 'p3',
    title: '3 — Traitement secondaire',
    sections: [
      {
        id: 'p3-1',
        title: '3.1 Absence ou non-conformité structurelle',
        phrases: [
          p('p3-1-1', 'Absence totale secondaire', "Aucun élément probant n'a permis d'attester de l'existence d'un dispositif de traitement secondaire sur la parcelle."),
          p('p3-1-2', 'Absence malgré dires propriétaire', "Après investigation, le SPANC n'est pas parvenu à repérer de traitement secondaire malgré les dires du propriétaire. Aucun élément probant n'a pu être apporté (factures, plans de récolement, photos). Cela ne peut donc pas entrer en compte dans la conclusion du contrôle. Le propriétaire peut proposer de rendre accessibles les boîtes de visite pour une contre-visite."),
          p('p3-1-3', 'Ancienne filière', "L'installation est équipée d'une ancienne filière de traitement dont la conception est antérieure aux techniques couramment mises en œuvre aujourd'hui. Ce type de filière n'est pas assimilé à un dispositif assurant un traitement secondaire. Les performances épuratoires attendues ne peuvent être présumées équivalentes à celles des dispositifs actuels."),
          p('p3-1-4', 'Microstation non agréée', "La microstation n'est pas agréée. Elle n'est pas considérée comme un dispositif de traitement complet, mais seulement comme un dispositif de traitement primaire. L'installation ne comprend donc pas de traitement secondaire."),
        ],
      },
      {
        id: 'p3-2',
        title: '3.2 Mauvaise implantation',
        phrases: [
          p('p3-2-1', 'Distances réglementaires', "Les distances d'implantation minimales ne sont pas respectées : 3 mètres des limites de propriétés et 5 mètres de l'habitation."),
          p('p3-2-2', 'Végétation', "Présence d'une haie (ou d'un arbre) à proximité de l'épandage, les racines présentent un risque de détérioration et de colmatage des drains."),
          p('p3-2-3', 'Circulation véhicules', "Les dispositifs du traitement secondaire doivent être situés hors des zones destinées à la circulation et au stationnement de tout véhicule (engin agricole, camion, voiture), hors des cultures, pâturages, plantations et zones de stockage, afin de ne pas détériorer les drains."),
          p('p3-2-4', 'Revêtement étanche', "Ne pas disposer de revêtement étanche sur les filières traditionnelles ou les aires d'infiltration afin que le sol reste oxygéné."),
        ],
      },
      {
        id: 'p3-3',
        title: '3.3 Sous-dimensionnement et matériaux',
        phrases: [
          p('p3-3-1', 'Tranchée unique', "Seulement une tranchée d'épandage, le traitement secondaire est sous dimensionné. Quelle que soit sa longueur, une tranchée d'épandage unique est considérée comme significativement sous-dimensionnée. Il faut au minimum deux tranchées d'épandage."),
          p('p3-3-2', 'Drains agricoles interdits', "Le traitement secondaire a été réalisé à l'aide de drains agricoles, lesquels sont interdits pour la réalisation d'un dispositif d'ANC (DTU 64.1). Ces canalisations doivent être remplacées par des matériaux conformes."),
          p('p3-3-3', 'Règle des 45 mL', "Le dimensionnement des tranchées d'épandage est réglementé par le DTU 64.1. La longueur totale connue des tranchées est de 30 ML (2x15). Le dimensionnement minimum est de 45 ML pour 5 pièces principales pour les sols les plus favorables. Le sous-dimensionnement est significatif lorsque la longueur totale est inférieure à 22.5 ML pour 1 à 5 pièces principales."),
          p('p3-3-4', 'Profondeur filtres à sable', "La profondeur est réglementée par le DTU 64.1 :\nFiltre à sable non drainé : fond de fouille à 1m10, remblai de terre de 20 cm max.\nFiltre à sable drainé : fond de fouille à 1m30, remblai de terre de 20 cm max.\nTranchées standards : fond de fouille à 60 ou 70 cm. Tranchées profondes : fond de fouille à 1m max, remblai 20 cm max."),
        ],
      },
      {
        id: 'p3-4',
        title: '3.4 Dysfonctionnements et accès',
        phrases: [
          p('p3-4-1', 'Absence regard bouclage', "Absence de regard de répartition et de bouclage, impossible de vérifier le bon fonctionnement du traitement secondaire. Rendre accessible ou mettre en place un regard de bouclage. En cas de dysfonctionnement majeur (eau dans le regard de bouclage), les tranchées d'épandage devront être remplacées."),
          p('p3-4-2', 'Profondeur excessive (Noé)', "La majeure partie du filtre à sable vertical non drainé est enterrée trop profondément, ce qui empêche le traitement de bien fonctionner."),
          p('p3-4-3', 'Regards apparents', "Pour faciliter le contrôle du traitement secondaire, il est conseillé de rendre les regards apparents au niveau du sol."),
        ],
      },
    ],
  },
  {
    id: 'p4',
    title: '4 — Évacuation des eaux traitées',
    sections: [
      {
        id: 'p4-1',
        title: '4.1 Infiltration et rejet',
        phrases: [
          p('p4-1-1', 'Infiltration par le sol', "Les eaux usées traitées sont évacuées, selon les règles de l'art, par le sol en place sous-jacent ou juxtaposé au traitement, au niveau de la parcelle, afin d'assurer la permanence de l'infiltration (si perméabilité comprise entre 10 et 500 mm/h)."),
          p('p4-1-2', 'Rejet au fossé', "Les eaux traitées seront évacuées dans le fossé communal (Arrêté N° ci-joint). Un regard muni d'un brise-jet et d'un clapet anti-retour sera installé avant le rejet au fossé. Le rejet se fera par une canalisation inclinée dans le sens de la pente, protégée par un bloc bétonné."),
          p('p4-1-3', 'Rejet réseau EP', "Une boîte de branchement sera installée par la collectivité en limite de propriété. Le pétitionnaire devra faire sa demande de branchement d'eaux pluviales après validation du permis de construire."),
        ],
      },
      {
        id: 'p4-2',
        title: '4.2 Interdictions et dangers',
        phrases: [
          p('p4-2-1', 'Rejet en puisard interdit', "Les rejets d'eaux usées domestiques, même traitées, sont interdits dans un puisard, puits perdu, puits désaffecté ou cavité. Un puisard n'est ni un ouvrage de traitement ni un ouvrage d'évacuation des eaux usées. Le SPANC prescrit les travaux de mise en conformité impliquant de revoir le mode d'évacuation."),
          p('p4-2-2', 'Danger sanitaire', "L'installation présente un danger pour la santé des personnes, risque de contact avec les eaux usées brutes et pré-traitées."),
          p('p4-2-3', 'Pollution voie publique', "La loi interdit le déversement d'eaux usées non traitées sur la voie publique (Article R*116-2 du Code de la voirie routière)."),
        ],
      },
    ],
  },
  {
    id: 'p5',
    title: '5 — Cas particuliers et zonages',
    sections: [
      {
        id: 'p5-1',
        title: '5.1 Périmètres de captage',
        phrases: [
          p('p5-1-1', 'PPR (rapproché)', "L'habitation est située dans le périmètre de protection rapprochée (PPR) d'un captage d'eau potable. La partie traitement devra se trouver dans une chambre en maçonnerie étanche et visitable à l'extérieur de l'habitation, et positionnée hors du périmètre de protection rapprochée."),
          p('p5-1-2', 'PPE (éloigné)', "L'habitation est située dans le périmètre éloigné d'un captage d'eau potable destinée à la consommation humaine."),
          p('p5-1-3', 'Zonage Noé', "Le zonage de l'assainissement sur la commune prévoit sur cette parcelle un filtre à sable drainé. En cas de dysfonctionnement majeur ou en cas de vente, les tranchées d'épandage devront être remplacées par un filtre à sable drainé ou par une filière agréée."),
        ],
      },
      {
        id: 'p5-2',
        title: '5.2 Toilettes sèches',
        phrases: [
          p('p5-2-1', 'Réglementation toilettes sèches', "Les toilettes dites sèches sont autorisées à la condition qu'elles ne génèrent aucune nuisance pour le voisinage, ni rejet liquide en dehors de la parcelle, ni pollution des eaux. Elles sont composées d'une cuve étanche recevant les fèces ou les urines, régulièrement vidée sur une aire étanche à l'abri des intempéries. Les sous-produits doivent être valorisés sur la parcelle. En cas d'utilisation de toilettes sèches, l'immeuble doit être équipé d'une installation conforme pour traiter les eaux ménagères."),
        ],
      },
      {
        id: 'p5-3',
        title: '5.3 Piscines',
        phrases: [
          p('p5-3-1', 'Eaux de vidange piscine', "Les eaux de vidange de la piscine ne doivent en aucun cas être évacuées dans la filière des eaux usées. Elles doivent être recyclées/traitées en circuit fermé. Elles peuvent être évacuées par épandage superficiel (après neutralisation des produits) ou au réseau des eaux pluviales (sous autorisation)."),
          p('p5-3-2', 'Lavage filtres piscine', "Les éluats de régénération des filtres peuvent être collectés à la filière d'assainissement des eaux usées. Ils ne doivent en aucun cas être mélangés aux eaux de vidange de la piscine ou collectés au réseau des eaux pluviales."),
        ],
      },
    ],
  },
  {
    id: 'p6',
    title: '6 — Conclusions, délais et prescriptions',
    sections: [
      {
        id: 'p6-1',
        title: '6.1 Diagnostic de vente',
        phrases: [
          p('p6-1-1', 'Obligation acquéreur (2023)', "Depuis le 1er janvier 2023, en cas de dysfonctionnement majeur, le nouveau propriétaire (acquéreur) dispose d'un délai d'un an à compter de la signature de l'acte de vente pour mettre son installation d'assainissement aux normes en vigueur."),
          p('p6-1-2', 'Information acquéreur', "Le vendeur peut décider de ne pas réaliser les travaux. Dans ce cas, il doit informer le futur acquéreur qui décidera ou non d'acquérir le bien en l'état. Les travaux peuvent faire partie de la négociation financière."),
          p('p6-1-3', 'Entretien pour vente', "Faire vidanger l'ensemble de l'installation pour la vente. Un curage des drains est fortement conseillé."),
        ],
      },
      {
        id: 'p6-2',
        title: '6.2 Contrôle bon fonctionnement / entretien',
        phrases: [
          p('p6-2-1', 'Délai 4 ans', "Aucun travail de réhabilitation depuis le dernier contrôle. Le propriétaire dispose d'un délai de 4 ans pour mettre son installation d'assainissement aux normes en vigueur."),
          p('p6-2-2', 'Fréquence entretien fosse', "L'entretien d'une fosse toutes eaux consiste en une vidange dès que les boues atteignent 50 % du niveau, ou tous les 4 ans maximum."),
          p('p6-2-3', 'Archivage entretien', "Les documents relatifs à l'entretien de la filière d'assainissement devront être envoyés au SPANC pour consultation et archivage."),
        ],
      },
      {
        id: 'p6-3',
        title: '6.3 Travaux de réhabilitation',
        phrases: [
          p('p6-3-1', 'Étude de sol obligatoire', "Une étude de sol devra être réalisée par un bureau d'étude pour définir la filière d'assainissement à mettre en place et son emplacement."),
          p('p6-3-2', 'Mise hors service ancien dispositif', "L'ancien dispositif d'assainissement ne sera pas conservé. Avant démolition, il devra être vidangé par une entreprise agréée."),
          p('p6-3-3', 'Mise en conformité totale', "La mise en conformité totale correspond à la réhabilitation de tous les éléments non conformes, avec la possibilité de conserver les éléments conformes à la réglementation."),
        ],
      },
    ],
  },
  {
    id: 'p7',
    title: '7 — Conception / réalisation',
    sections: [
      {
        id: 'p7-1',
        title: '7.1 Préconisations techniques courantes',
        phrases: [
          p('p7-1-1', 'Regard de collecte', "Un regard de collecte devra être implanté en amont de la fosse toutes eaux sur la canalisation des eaux usées."),
          p('p7-1-2', 'Remontée de nappe', "Une dalle d'amarrage (ou de lestage avec puits de décompression) devra être mise en place sous l'ensemble de l'installation pour éviter aux ouvrages de remonter en cas de remontée de nappe."),
          p('p7-1-3', 'Circulation véhicules', "Une dalle de répartition doit être mise en place pour protéger les ouvrages afin de supporter le passage de véhicules (3.5T min.). Les canalisations passant sous les voies de circulation devront être renforcées."),
          p('p7-1-4', 'Poste de relevage', "Un poste de relevage est nécessaire en sortie de fosse (ou filière). La pompe devra être branchée sur un disjoncteur séparé en 16 A."),
          p('p7-1-5', 'Épandage / filtre', "Le filtre à sable (ou lit d'infiltration) devra être installé de manière plane, la pente du terrain devra être rattrapée avec un remblai de terre de 20 cm maximum. Une barrière anti-racine devra être installée."),
          p('p7-1-6', 'Tunnels d\'infiltration', "L'infiltration se fera par [X] tunnels d'infiltrations posés sur 15-20cm de gravillon 10/20. Le fond de fouille devra être au minimum à 80 cm (ou à 1m max par rapport au TN). Un té de visite avec ventilation primaire sera installé sur le dernier tunnel."),
        ],
      },
      {
        id: 'p7-2',
        title: '7.2 Filières agréées',
        phrases: [
          p('p7-2-1', 'Intermittence microstation', "Sauf disposition contraire du constructeur stipulée dans l'agrément, ce dispositif n'est pas adapté à un fonctionnement par intermittence (habitation secondaire). Les microstations ont besoin d'un apport régulier pour maintenir les bactéries actives."),
          p('p7-2-2', 'Phytoépuration', "L'implantation devra respecter le DTU 64.1, le cahier des charges du constructeur et les préconisations du bureau d'étude. Distances : > 10 m de l'habitation, 3 m des limites séparatives, 3 m des végétaux à enracinement profond, 35 m d'un captage. Une clôture rigide (min. 0,8 m) avec portillon fermé à clef est obligatoire pour limiter l'accès."),
          p('p7-2-3', 'Contrôle de réalisation', "Un regard muni d'un brise-jet sera installé en sortie de la filière agréée avant l'infiltration ou le rejet."),
        ],
      },
      {
        id: 'p7-3',
        title: '7.3 Courrier retour dossier conception',
        phrases: [
          p('p7-3-1', 'Courrier retour dossier', "Bonjour, veuillez trouver ci-joint le dossier de conception relatif à votre projet d'installation d'assainissement non collectif. Ce dossier devra être complété en tenant compte des préconisations figurant dans le rapport d'étude de sol, puis signé par le propriétaire. Une fois le dossier complété, signé et accompagné de l'étude de sol ainsi que de l'ensemble des pièces demandées, je vous remercie de le retourner au SPANC afin qu'il puisse être instruit. Après instruction, un avis de conception vous sera notifié. Les travaux ne devront en aucun cas être engagés avant la réception de cet avis. Je reste à votre disposition pour tout renseignement complémentaire. Cordialement, Le SPANC."),
        ],
      },
    ],
  },
]

export function appendRedactionText(current: string, addition: string): string {
  const trimmed = current.trim()
  if (!trimmed) return addition
  return `${trimmed}\n\n${addition}`
}

export function findPhraseById(phraseId: string): RedactionPhrase | undefined {
  for (const part of REDACTION_AIDE_SPANC) {
    for (const section of part.sections) {
      const found = section.phrases.find(ph => ph.id === phraseId)
      if (found) return found
    }
  }
  return undefined
}
