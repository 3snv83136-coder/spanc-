export type TypeFormulaire =
  | 'conception-demande'
  | 'conception-controle'
  | 'diagnostic'

export interface CoordonneesFormulaire {
  nom: string
  prenom: string
  adresse: string
  codePostal: string
  commune: string
  sectionCadastrale: string
  numeroParcelle: string
  telephone: string
  email: string
}

export interface FormulaireBase {
  id: string
  type: TypeFormulaire
  numero: string
  date: string
  technicien: string
  coordonnees: CoordonneesFormulaire
  adresseProjet?: string
  communeProjet?: string
  messageAgent?: string
}

export interface FormulaireConceptionDemande extends FormulaireBase {
  type: 'conception-demande'
  natureDemande: string[]
  nbPiecesPrincipales: string
  nbEH: string
  residenceType: string
  concepteurNom: string
  concepteurTel: string
  concepteurEmail: string
  installateurNom: string
  installateurTel: string
  dispositifExistant: 'oui' | 'non' | ''
  elementsConserves: string
  alimentationEau: string
  eauxPluviales: string
  surfaceParcelle: string
  penteTerrain: string
  pretraitement: string
  traitementSecondaire: string
  evacuation: string
  observations: string
}

export interface FormulaireConceptionControle extends FormulaireBase {
  type: 'conception-controle'
  natureProjet: string
  bureauEtudes: string
  entreprise: string
  filierePrevue: string
  filiereSecondaire: string
  pointsControles: string
  conformiteImplantation: 'conforme' | 'non_conforme' | 'reserve' | ''
  conformiteDimensionnement: 'conforme' | 'non_conforme' | 'reserve' | ''
  conformiteMateriaux: 'conforme' | 'non_conforme' | 'reserve' | ''
  prescriptions: string
  conclusion: string
  dateControleTerrain: string
}

export interface FormulaireDiagnostic extends FormulaireBase {
  type: 'diagnostic'
  demandeurType: string
  personneRencontree: string
  statutRencontre: string
  occupantType: string
  nbPiecesPrincipales: string
  nbHabitants: string
  residenceType: string
  alimentationEau: string
  eauxPluviales: string
  ageInstallation: string
  dernierEntretien: string
  controlePrecedent: string
  collecteTransport: string
  traitementPrimaire: string
  traitementSecondaire: string
  evacuationTraitee: string
  dispositifsAnnexes: string
  conclusionDiagnostic: string
  travauxNecessaires: string
  delaiMiseConformite: string
}

export type FormulaireSPANC =
  | FormulaireConceptionDemande
  | FormulaireConceptionControle
  | FormulaireDiagnostic

export const FORMULAIRE_META: Record<TypeFormulaire, {
  title: string
  short: string
  subtitle: string
  icon: string
  gradient: string
  ring: string
  shadow: string
  modelePdf?: string
}> = {
  'conception-demande': {
    title: 'Demande de contrôle de conception',
    short: 'Conception',
    subtitle: 'Dossier usager — projet ANC neuf ou réhabilitation',
    icon: '📋',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    ring: 'ring-violet-400/40',
    shadow: 'shadow-violet-500/30',
    modelePdf: undefined,
  },
  'conception-controle': {
    title: 'Contrôle de conception SPANC',
    short: 'Contrôle conception',
    subtitle: 'Fiche SPANC — examen et contrôle sur site',
    icon: '🏗️',
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    ring: 'ring-cyan-400/40',
    shadow: 'shadow-cyan-500/30',
    modelePdf: '/formulaires/modele-conception-spanc-v2025.pdf',
  },
  diagnostic: {
    title: 'Diagnostic ANC',
    short: 'Diagnostic',
    subtitle: 'Contrôle diagnostic — vente ou état installation',
    icon: '🔍',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    ring: 'ring-orange-400/40',
    shadow: 'shadow-orange-500/30',
    modelePdf: undefined,
  },
}

export function emptyCoordonnees(): CoordonneesFormulaire {
  return {
    nom: '', prenom: '', adresse: '', codePostal: '', commune: '',
    sectionCadastrale: '', numeroParcelle: '', telephone: '', email: '',
  }
}

export function newFormulaire(type: TypeFormulaire, technicien = ''): FormulaireSPANC {
  const base = {
    id: crypto.randomUUID(),
    numero: `FORM-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    technicien,
    coordonnees: emptyCoordonnees(),
    adresseProjet: '',
    communeProjet: '',
    messageAgent: '',
  }

  if (type === 'conception-demande') {
    return {
      ...base,
      type: 'conception-demande',
      natureDemande: [],
      nbPiecesPrincipales: '',
      nbEH: '',
      residenceType: '',
      concepteurNom: '', concepteurTel: '', concepteurEmail: '',
      installateurNom: '', installateurTel: '',
      dispositifExistant: '',
      elementsConserves: '',
      alimentationEau: '',
      eauxPluviales: '',
      surfaceParcelle: '',
      penteTerrain: '',
      pretraitement: '',
      traitementSecondaire: '',
      evacuation: '',
      observations: '',
    }
  }

  if (type === 'conception-controle') {
    return {
      ...base,
      type: 'conception-controle',
      natureProjet: '',
      bureauEtudes: '',
      entreprise: '',
      filierePrevue: '',
      filiereSecondaire: '',
      pointsControles: '',
      conformiteImplantation: '',
      conformiteDimensionnement: '',
      conformiteMateriaux: '',
      prescriptions: '',
      conclusion: '',
      dateControleTerrain: '',
    }
  }

  return {
    ...base,
    type: 'diagnostic',
    demandeurType: '',
    personneRencontree: '',
    statutRencontre: '',
    occupantType: '',
    nbPiecesPrincipales: '',
    nbHabitants: '',
    residenceType: '',
    alimentationEau: '',
    eauxPluviales: '',
    ageInstallation: '',
    dernierEntretien: '',
    controlePrecedent: '',
    collecteTransport: '',
    traitementPrimaire: '',
    traitementSecondaire: '',
    evacuationTraitee: '',
    dispositifsAnnexes: '',
    conclusionDiagnostic: '',
    travauxNecessaires: '',
    delaiMiseConformite: '',
  }
}
