import type {
  AvisConformite,
  FiliereSPANC,
  RapportSPANC,
  TypeControle,
  TypePretraitement,
  TypeTraitement,
  TypeRejet,
  UsagerSPANC,
} from '@/lib/types/spanc'

export const DRAFT_CURRENT_ID = 'current'

export interface StoredPhoto {
  dataUrl: string
  legende: string
  name: string
}

export interface ControleDraft {
  id: string
  updatedAt: string
  typeControle: TypeControle
  nom: string
  prenom: string
  adresse: string
  codePostal: string
  commune: string
  sectionCadastrale: string
  numeroParcelle: string
  email: string
  telephone: string
  nbPieces: number | ''
  typePretraitement: TypePretraitement | ''
  volumePretraitement: number | ''
  typeTraitement: TypeTraitement | ''
  typeRejet: TypeRejet | ''
  dateInstallation: string
  derniereVidange: string
  checkboxes: Record<string, boolean>
  niveauBoues: number
  avisAgent: AvisConformite
  dictee: string
  photos: StoredPhoto[]
  technicien: string
  dateControle: string
}

export interface GenerateRapportPayload {
  typeControle: TypeControle
  usager: UsagerSPANC
  filiere: FiliereSPANC
  dictee: string
  checkboxes: Record<string, boolean>
  niveauBoues: number
  avisAgent: AvisConformite
  technicien: string
  dateControle: string
  numeroRapport?: string
}

export interface SendEmailPayload {
  rapport: RapportSPANC
  photos: { url: string; legende?: string }[]
  planImage?: string
  to: string
}

export type SyncJobType = 'generate_rapport' | 'send_email'
export type SyncJobStatus = 'pending' | 'processing' | 'done' | 'error'

export interface SyncJob {
  id: string
  type: SyncJobType
  status: SyncJobStatus
  createdAt: string
  updatedAt: string
  label: string
  error?: string
  numeroRapport?: string
  generatePayload?: GenerateRapportPayload
  emailPayload?: SendEmailPayload
  /** Rapport enrichi par l'IA après synchronisation */
  enrichedRapport?: RapportSPANC
}

export const OFFLINE_SYNC_EVENT = 'spanc-offline-sync'
