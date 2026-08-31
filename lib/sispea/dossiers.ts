import type { AvisConformite } from '@/lib/types/spanc'

const STORAGE_KEY = 'spanc_dossiers'

export interface DossierControle {
  numeroRapport: string
  typeControle: string
  dateControle: string
  avisConformite: AvisConformite
  usager: {
    nom: string
    prenom: string
    adresse: string
    commune: string
    sectionCadastrale?: string
    numeroParcelle?: string
  }
}

export function loadDossiers(): DossierControle[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DossierControle[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDossier(dossier: DossierControle): void {
  if (typeof window === 'undefined') return
  const existing = loadDossiers()
  const idx = existing.findIndex(d => d.numeroRapport === dossier.numeroRapport)
  const next = [...existing]
  if (idx >= 0) next[idx] = dossier
  else next.unshift(dossier)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

/** Conforme ou mis en conformité validé (hors non-conformités). */
export function isInstallationConforme(avis: AvisConformite): boolean {
  return avis === 'conforme' || avis === 'conforme_recommandations'
}

export function statsConformiteDepuisDossiers(dossiers: DossierControle[]) {
  const nbInstallationsControleesTotal = dossiers.length
  const nbInstallationsConformesTotal = dossiers.filter(d => isInstallationConforme(d.avisConformite)).length
  return { nbInstallationsControleesTotal, nbInstallationsConformesTotal }
}
