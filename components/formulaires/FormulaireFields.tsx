'use client'

import type { FormField } from '@/lib/formulaires/schemas'
import { getNestedValue, setNestedValue } from '@/lib/formulaires/schemas'
import type { FormulaireSPANC } from '@/lib/formulaires/types'
import CommuneSensCombobox from '@/components/CommuneSensCombobox'

interface Props {
  form: FormulaireSPANC
  fields: FormField[]
  onChange: (form: FormulaireSPANC) => void
  readOnlyKeys?: Set<string>
}

export default function FormulaireFields({ form, fields, onChange, readOnlyKeys }: Props) {
  function update(key: string, value: unknown) {
    if (readOnlyKeys?.has(key) || fields.find(f => f.key === key)?.readOnly) return
    onChange(setNestedValue(form as unknown as Record<string, unknown>, key, value) as unknown as FormulaireSPANC)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map(field => {
        const isReadOnly = field.readOnly || readOnlyKeys?.has(field.key)
        const raw = getNestedValue(form as unknown as Record<string, unknown>, field.key)
        const id = `ff-${field.key.replace(/\./g, '-')}`

        if (field.type === 'textarea') {
          return (
            <label key={field.key} className="sm:col-span-2 block space-y-1">
              <span className="spanc-label">{field.label}{field.required && ' *'}</span>
              {field.hint && <span className="text-[11px] text-white/50 block -mt-0.5">{field.hint}</span>}
              <textarea
                id={id}
                rows={field.rows ?? 3}
                value={String(raw ?? '')}
                onChange={e => update(field.key, e.target.value)}
                readOnly={isReadOnly}
                className={`spanc-input min-h-[80px] ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={field.placeholder}
              />
            </label>
          )
        }

        if (field.type === 'checkbox-group' && field.options) {
          const selected = Array.isArray(raw) ? (raw as string[]) : []
          return (
            <div key={field.key} className="sm:col-span-2 space-y-2">
              <span className="spanc-label">{field.label}</span>
              <div className="grid grid-cols-1 gap-2">
                {field.options.map(opt => {
                  const active = selected.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        const next = active
                          ? selected.filter(v => v !== opt.value)
                          : [...selected, opt.value]
                        update(field.key, next)
                      }}
                      className={`spanc-check text-left text-sm ${active ? 'spanc-check-active' : ''}`}
                    >
                      <span className={`text-lg ${active ? 'text-emerald-400' : 'text-white/30'}`}>{active ? '☑' : '☐'}</span>
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        }

        if (field.type === 'radio' && field.options) {
          return (
            <div key={field.key} className={`space-y-2 ${field.half ? '' : 'sm:col-span-2'}`}>
              <span className="spanc-label">{field.label}</span>
              <div className="flex flex-wrap gap-2">
                {field.options.map(opt => {
                  const active = raw === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => update(field.key, opt.value)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                        active
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-white/10 text-white/80 ring-1 ring-white/20 hover:bg-white/15'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        }

        if (field.type === 'select' && field.options) {
          return (
            <label key={field.key} className={`block space-y-1 ${field.half ? '' : 'sm:col-span-2'}`}>
              <span className="spanc-label">{field.label}</span>
              <select
                id={id}
                value={String(raw ?? '')}
                onChange={e => update(field.key, e.target.value)}
                disabled={isReadOnly}
                className={`spanc-select ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">— Choisir —</option>
                {field.options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          )
        }

        const inputType = field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'

        if (field.key === 'coordonnees.commune') {
          return (
            <div key={field.key} className={field.half ? '' : 'sm:col-span-2'}>
              <span className="spanc-label block mb-1">{field.label}{field.required ? ' *' : ''}</span>
              <CommuneSensCombobox
                value={String(raw ?? '')}
                onChange={v => update(field.key, v)}
                onSelect={c => {
                  let next = setNestedValue(form as unknown as Record<string, unknown>, field.key, c.nom) as unknown as FormulaireSPANC
                  if (!form.coordonnees.codePostal && c.cp) {
                    next = setNestedValue(next as unknown as Record<string, unknown>, 'coordonnees.codePostal', c.cp) as unknown as FormulaireSPANC
                  }
                  onChange(next)
                }}
              />
            </div>
          )
        }

        return (
          <label key={field.key} className={`block space-y-1 ${field.half ? '' : 'sm:col-span-2'}`}>
            <span className="spanc-label">{field.label}{field.required && ' *'}</span>
            <input
              id={id}
              type={inputType}
              value={String(raw ?? '')}
              onChange={e => update(field.key, e.target.value)}
              readOnly={isReadOnly}
              className={`spanc-input ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder={field.placeholder}
            />
          </label>
        )
      })}
    </div>
  )
}
