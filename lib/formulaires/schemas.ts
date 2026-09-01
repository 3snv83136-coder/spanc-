import type { TypeFormulaire } from './types'

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea' | 'select' | 'checkbox-group' | 'radio'

export interface FormField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: { value: string; label: string }[]
  rows?: number
  half?: boolean
  required?: boolean
  hint?: string
  readOnly?: boolean
}

export interface FormSection {
  id: string
  title: string
  emoji: string
  color: string
  fields: FormField[]
}

const COORDONNEES: FormSection = {
  id: 'coordonnees',
  title: 'Coordonnées usager',
  emoji: '👤',
  color: 'from-blue-500/20 to-indigo-500/10 ring-blue-400/30',
  fields: [
    { key: 'coordonnees.prenom', label: 'Prénom', type: 'text', half: true, required: true },
    { key: 'coordonnees.nom', label: 'Nom', type: 'text', half: true, required: true },
    { key: 'coordonnees.adresse', label: 'Adresse', type: 'text', required: true },
    { key: 'coordonnees.codePostal', label: 'Code postal', type: 'text', half: true, required: true },
    { key: 'coordonnees.commune', label: 'Commune', type: 'text', half: true, required: true },
    { key: 'coordonnees.telephone', label: 'Téléphone', type: 'tel', half: true },
    { key: 'coordonnees.email', label: 'E-mail usager', type: 'email', half: true, required: true },
    { key: 'coordonnees.sectionCadastrale', label: 'Section cadastrale', type: 'text', half: true },
    { key: 'coordonnees.numeroParcelle', label: 'N° parcelle', type: 'text', half: true },
    { key: 'adresseProjet', label: 'Adresse du projet (si différente)', type: 'text' },
    { key: 'communeProjet', label: 'Commune du projet', type: 'text', half: true },
    { key: 'date', label: 'Date', type: 'date', half: true, required: true },
    { key: 'technicien', label: 'Technicien SPANC', type: 'text', half: true },
  ],
}

const SCHEMAS: Record<TypeFormulaire, FormSection[]> = {
  'conception-demande': [
    COORDONNEES,
    {
      id: 'projet',
      title: 'Nature du projet',
      emoji: '🏠',
      color: 'from-violet-500/20 to-purple-500/10 ring-violet-400/30',
      fields: [
        {
          key: 'natureDemande',
          label: 'Cadre de la demande',
          type: 'checkbox-group',
          options: [
            { value: 'pc_neuf', label: 'Permis de construire — construction neuve' },
            { value: 'pc_existant', label: 'PC — transformation / agrandissement' },
            { value: 'sans_pc', label: 'Réhabilitation ou création sans PC' },
            { value: 'modif_spanc', label: 'Modification suite à avis SPANC négatif' },
          ],
        },
        { key: 'residenceType', label: 'Type de résidence', type: 'select', options: [
          { value: 'principale', label: 'Principale' },
          { value: 'secondaire', label: 'Secondaire' },
          { value: 'location', label: 'Location' },
          { value: 'autre', label: 'Autre' },
        ]},
        { key: 'nbPiecesPrincipales', label: 'Nombre de pièces principales', type: 'number', half: true },
        { key: 'nbEH', label: 'Équivalents-Habitants retenus', type: 'number', half: true },
        { key: 'dispositifExistant', label: 'Dispositif existant sur parcelle', type: 'radio', options: [
          { value: 'oui', label: 'Oui' },
          { value: 'non', label: 'Non' },
        ]},
        { key: 'elementsConserves', label: 'Éléments conservés (si oui)', type: 'textarea', rows: 2 },
      ],
    },
    {
      id: 'intervenants',
      title: 'Concepteur & installateur',
      emoji: '👷',
      color: 'from-emerald-500/20 to-teal-500/10 ring-emerald-400/30',
      fields: [
        { key: 'concepteurNom', label: 'Bureau d\'études / concepteur', type: 'text' },
        { key: 'concepteurTel', label: 'Tél. concepteur', type: 'tel', half: true },
        { key: 'concepteurEmail', label: 'E-mail concepteur', type: 'email', half: true },
        { key: 'installateurNom', label: 'Entreprise installatrice', type: 'text' },
        { key: 'installateurTel', label: 'Tél. installateur', type: 'tel', half: true },
      ],
    },
    {
      id: 'installation',
      title: 'Installation projetée',
      emoji: '⚙️',
      color: 'from-amber-500/20 to-orange-500/10 ring-amber-400/30',
      fields: [
        { key: 'alimentationEau', label: 'Alimentation en eau potable', type: 'textarea', rows: 2 },
        { key: 'eauxPluviales', label: 'Évacuation eaux pluviales', type: 'textarea', rows: 2 },
        { key: 'surfaceParcelle', label: 'Surface parcelle (m²)', type: 'text', half: true },
        { key: 'penteTerrain', label: 'Pente du terrain', type: 'select', half: true, options: [
          { value: '<5', label: '< 5 %' },
          { value: '5-10', label: '5 à 10 %' },
          { value: '>10', label: '> 10 %' },
        ]},
        { key: 'pretraitement', label: 'Prétraitement / traitement primaire', type: 'textarea', rows: 3, hint: 'Fosse, bac à graisses, volumes…' },
        { key: 'traitementSecondaire', label: 'Traitement secondaire', type: 'textarea', rows: 3, hint: 'Tranchées, filtre à sable, filière agréée…' },
        { key: 'evacuation', label: 'Évacuation des eaux traitées', type: 'textarea', rows: 2 },
        { key: 'observations', label: 'Observations complémentaires', type: 'textarea', rows: 3 },
      ],
    },
  ],
  'conception-controle': [
    COORDONNEES,
    {
      id: 'projet',
      title: 'Projet contrôlé',
      emoji: '📐',
      color: 'from-cyan-500/20 to-sky-500/10 ring-cyan-400/30',
      fields: [
        { key: 'natureProjet', label: 'Nature du projet', type: 'textarea', rows: 2 },
        { key: 'bureauEtudes', label: 'Bureau d\'études', type: 'text' },
        { key: 'entreprise', label: 'Entreprise en charge des travaux', type: 'text' },
        { key: 'filierePrevue', label: 'Filière primaire prévue', type: 'textarea', rows: 2 },
        { key: 'filiereSecondaire', label: 'Filière secondaire prévue', type: 'textarea', rows: 2 },
        { key: 'dateControleTerrain', label: 'Date contrôle sur site', type: 'date', half: true },
      ],
    },
    {
      id: 'controle',
      title: 'Points de contrôle',
      emoji: '✅',
      color: 'from-blue-500/20 to-indigo-500/10 ring-blue-400/30',
      fields: [
        { key: 'pointsControles', label: 'Éléments contrôlés', type: 'textarea', rows: 4, hint: 'Implantation, distances, ventilation, matériaux…' },
        { key: 'conformiteImplantation', label: 'Implantation', type: 'select', options: [
          { value: 'conforme', label: '✅ Conforme' },
          { value: 'reserve', label: '🟡 Réserve' },
          { value: 'non_conforme', label: '❌ Non conforme' },
        ]},
        { key: 'conformiteDimensionnement', label: 'Dimensionnement', type: 'select', options: [
          { value: 'conforme', label: '✅ Conforme' },
          { value: 'reserve', label: '🟡 Réserve' },
          { value: 'non_conforme', label: '❌ Non conforme' },
        ]},
        { key: 'conformiteMateriaux', label: 'Matériaux & exécution', type: 'select', options: [
          { value: 'conforme', label: '✅ Conforme' },
          { value: 'reserve', label: '🟡 Réserve' },
          { value: 'non_conforme', label: '❌ Non conforme' },
        ]},
        { key: 'prescriptions', label: 'Prescriptions', type: 'textarea', rows: 4 },
        { key: 'conclusion', label: 'Conclusion SPANC', type: 'textarea', rows: 4 },
      ],
    },
  ],
  diagnostic: [
    COORDONNEES,
    {
      id: 'contexte',
      title: 'Contexte du diagnostic',
      emoji: '📋',
      color: 'from-orange-500/20 to-red-500/10 ring-orange-400/30',
      fields: [
        { key: 'demandeurType', label: 'Le demandeur est', type: 'select', options: [
          { value: 'particulier', label: 'Un particulier' },
          { value: 'notaire', label: 'Un notaire' },
          { value: 'agence', label: 'Une agence immobilière' },
        ]},
        { key: 'personneRencontree', label: 'Personne rencontrée', type: 'text', half: true },
        { key: 'statutRencontre', label: 'Statut', type: 'text', half: true },
        { key: 'occupantType', label: 'Occupant', type: 'select', options: [
          { value: 'locataire', label: 'Locataire' },
          { value: 'proprietaire', label: 'Propriétaire' },
          { value: 'inoccupe', label: 'Habitation inoccupée' },
        ]},
        { key: 'residenceType', label: 'Type de résidence', type: 'select', options: [
          { value: 'principale', label: 'Principale' },
          { value: 'secondaire', label: 'Secondaire' },
          { value: 'location', label: 'Location' },
        ]},
        { key: 'nbPiecesPrincipales', label: 'Pièces principales', type: 'number', half: true },
        { key: 'nbHabitants', label: 'Habitants permanents', type: 'number', half: true },
      ],
    },
    {
      id: 'installation',
      title: 'Installation constatée',
      emoji: '🔧',
      color: 'from-amber-500/20 to-yellow-500/10 ring-amber-400/30',
      fields: [
        { key: 'alimentationEau', label: 'Alimentation eau potable', type: 'textarea', rows: 2 },
        { key: 'eauxPluviales', label: 'Collecte eaux pluviales', type: 'textarea', rows: 2 },
        { key: 'ageInstallation', label: 'Âge de l\'installation', type: 'text', half: true },
        { key: 'dernierEntretien', label: 'Dernier entretien', type: 'text', half: true },
        { key: 'controlePrecedent', label: 'Dernier contrôle SPANC', type: 'textarea', rows: 2 },
        { key: 'collecteTransport', label: 'Collecte & transport EU', type: 'textarea', rows: 3 },
        { key: 'traitementPrimaire', label: 'Traitement primaire', type: 'textarea', rows: 3 },
        { key: 'traitementSecondaire', label: 'Traitement secondaire', type: 'textarea', rows: 3 },
        { key: 'evacuationTraitee', label: 'Évacuation eaux traitées', type: 'textarea', rows: 2 },
        { key: 'dispositifsAnnexes', label: 'Dispositifs annexes', type: 'textarea', rows: 2, hint: 'Relevage, ventilations, toilettes sèches…' },
      ],
    },
    {
      id: 'conclusion',
      title: 'Conclusion diagnostic',
      emoji: '📊',
      color: 'from-rose-500/20 to-pink-500/10 ring-rose-400/30',
      fields: [
        { key: 'conclusionDiagnostic', label: 'Conclusion', type: 'textarea', rows: 4 },
        { key: 'travauxNecessaires', label: 'Travaux nécessaires', type: 'textarea', rows: 3 },
        { key: 'delaiMiseConformite', label: 'Délai de mise en conformité', type: 'text', hint: 'Ex. 4 ans, 1 an (vente), urgence…' },
      ],
    },
  ],
}

export function getFormSections(type: TypeFormulaire): FormSection[] {
  return SCHEMAS[type]
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

export function setNestedValue<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const parts = path.split('.')
  const clone = structuredClone(obj)
  let cur: Record<string, unknown> = clone
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {}
    cur = cur[p] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
  return clone
}
