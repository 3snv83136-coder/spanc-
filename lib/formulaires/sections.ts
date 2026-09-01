import type { TypeFormulaire } from './types'
import { getFormSections, getNestedValue, type FormField, type FormSection } from './schemas'

/** Sections réservées au SPANC (non envoyées au client) */
const AGENT_ONLY_SECTIONS: Record<TypeFormulaire, string[]> = {
  'conception-demande': [],
  'conception-controle': ['controle'],
  'diagnostic': ['conclusion'],
}

/** Champs en lecture seule côté client */
const CLIENT_READONLY_KEYS = new Set(['technicien', 'date', 'numero'])

export function getClientSections(type: TypeFormulaire): FormSection[] {
  const skip = new Set(AGENT_ONLY_SECTIONS[type])
  return getFormSections(type)
    .filter(s => !skip.has(s.id))
    .map(section => ({
      ...section,
      fields: section.fields.filter(f => !CLIENT_READONLY_KEYS.has(f.key)),
    }))
}

export function getAgentPrefillSection(type: TypeFormulaire): FormSection | null {
  const coord = getFormSections(type).find(s => s.id === 'coordonnees')
  if (!coord) return null
  return {
    ...coord,
    title: 'Pré-remplissage (optionnel)',
    fields: coord.fields.filter(f => !CLIENT_READONLY_KEYS.has(f.key)),
  }
}

export function validateClientForm(
  type: TypeFormulaire,
  form: Record<string, unknown>,
): string[] {
  const errors: string[] = []
  for (const section of getClientSections(type)) {
    for (const field of section.fields) {
      if (!field.required) continue
      const raw = getNestedValue(form, field.key)
      const empty = raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)
      if (empty) errors.push(field.label)
    }
  }
  return errors
}

export function filterFields(fields: FormField[], readOnlyKeys?: Set<string>): FormField[] {
  if (!readOnlyKeys?.size) return fields
  return fields.map(f => ({ ...f, readOnly: readOnlyKeys.has(f.key) }))
}
