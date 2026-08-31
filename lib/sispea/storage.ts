import { defaultServiceExercice, type ServiceExerciceANC } from '@/lib/types/sispea'

const STORAGE_KEY = 'spanc_sispea_config'

export function loadSispeaConfig(): ServiceExerciceANC {
  if (typeof window === 'undefined') return defaultServiceExercice()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultServiceExercice()
    return { ...defaultServiceExercice(), ...JSON.parse(raw) }
  } catch {
    return defaultServiceExercice()
  }
}

export function saveSispeaConfig(config: ServiceExerciceANC): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function validateSispeaReferentiel(config: ServiceExerciceANC): string[] {
  const errors: string[] = []
  if (!config.serviceIdSispea.trim()) errors.push('SERVICE_ID SISPEA requis')
  if (!config.equipementIdSispea.trim()) errors.push('EQUIPEMENT_ID SISPEA requis')
  if (!config.annee || config.annee < 2000 || config.annee > 2100) errors.push('Année d\'exercice invalide')
  if (config.habitantsDesservis < 0) errors.push('Habitants desservis : valeur invalide')
  if (config.nbInstallationsControleesTotal < 0) errors.push('Nombre d\'installations contrôlées invalide')
  if (config.nbInstallationsConformesTotal < 0) errors.push('Nombre d\'installations conformes invalide')
  if (config.nbInstallationsConformesTotal > config.nbInstallationsControleesTotal) {
    errors.push('Le nombre de conformes ne peut pas dépasser le nombre de contrôles')
  }
  return errors
}
