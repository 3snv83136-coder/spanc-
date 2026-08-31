'use client'
import { useEffect, useRef, useState } from "react"
import { COMMUNES_SENS, searchCommunes, findCommuneByName, type CommuneSens } from "@/lib/communes-sens"
import { spanc } from "@/lib/spanc-ui"

interface Props {
  value: string
  onChange: (s: string) => void
  onSelect: (c: CommuneSens) => void
  placeholder?: string
  className?: string
}

export default function CommuneSensCombobox({ value, onChange, onSelect, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = value.trim().length >= 1 ? searchCommunes(value, 8) : COMMUNES_SENS.slice(0, 8)
  const isExactMatch = !!findCommuneByName(value)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(c: CommuneSens) {
    onSelect(c)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <label className={spanc.label}>Commune</label>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlight(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (!open) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, suggestions.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
          else if (e.key === 'Enter' && suggestions[highlight]) { e.preventDefault(); pick(suggestions[highlight]) }
          else if (e.key === 'Escape') setOpen(false)
        }}
        placeholder={placeholder || 'Sens, Paron, Saint-Clément…'}
        autoComplete="off"
        className={className || (isExactMatch ? spanc.inputOk : spanc.input)}
      />
      {isExactMatch && <span className="absolute right-3 top-[2.1rem] text-emerald-400 text-lg">✓</span>}
      {open && suggestions.length > 0 && (
        <div className={spanc.dropdown}>
          {suggestions.map((c, i) => (
            <button
              key={c.nom}
              type="button"
              onClick={() => pick(c)}
              onMouseEnter={() => setHighlight(i)}
              className={`${spanc.dropdownItem} flex justify-between items-center ${i === highlight ? spanc.dropdownItemActive : ''}`}
            >
              <span className="font-semibold">{c.nom}</span>
              <span className="text-xs font-mono text-white/50">{c.cp}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
