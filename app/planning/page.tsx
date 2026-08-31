'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import CommuneSensCombobox from '@/components/CommuneSensCombobox'
import {
  TYPE_RDV_LABELS,
  STATUT_RDV_LABELS,
  formatHeureFin,
  newRdvId,
  todayISO,
  type RendezVous,
  type StatutRdv,
  type TypeRdv,
} from '@/lib/types/planning'
import {
  deleteRdv,
  getRdvsForDate,
  loadRdvs,
  saveRdv,
  updateRdvStatut,
} from '@/lib/planning/storage'

function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function startOfWeek(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const day = d.getDay() // 0=dim
  const mondayOffset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + mondayOffset)
  return d.toISOString().slice(0, 10)
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const emptyForm = {
  heure: '09:00',
  dureeMin: 60,
  type: 'periodique' as TypeRdv,
  usagerNom: '',
  usagerPrenom: '',
  adresse: '',
  commune: '',
  telephone: '',
  notes: '',
}

export default function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [technicien, setTechnicien] = useState('')
  const [error, setError] = useState('')

  function refresh() {
    setRdvs(loadRdvs())
  }

  useEffect(() => {
    refresh()
    const t = localStorage.getItem('spanc_technicien')
    if (t) setTechnicien(t)
  }, [])

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const dayRdvs = useMemo(
    () => getRdvsForDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, rdvs],
  )

  const weekCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const day of weekDays) {
      map[day] = getRdvsForDate(day).filter(r => r.statut !== 'annule').length
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, rdvs])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(rdv: RendezVous) {
    setEditingId(rdv.id)
    setForm({
      heure: rdv.heure,
      dureeMin: rdv.dureeMin,
      type: rdv.type,
      usagerNom: rdv.usagerNom,
      usagerPrenom: rdv.usagerPrenom,
      adresse: rdv.adresse,
      commune: rdv.commune,
      telephone: rdv.telephone || '',
      notes: rdv.notes || '',
    })
    setError('')
    setShowForm(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.usagerNom.trim() && !form.usagerPrenom.trim()) {
      setError('Indiquez au moins un nom ou prénom.')
      return
    }
    if (!form.commune.trim()) {
      setError('Commune requise.')
      return
    }
    if (!form.heure) {
      setError('Heure requise.')
      return
    }

    const now = new Date().toISOString()
    const existing = editingId ? rdvs.find(r => r.id === editingId) : null
    const rdv: RendezVous = {
      id: editingId || newRdvId(),
      date: selectedDate,
      heure: form.heure,
      dureeMin: form.dureeMin,
      type: form.type,
      statut: existing?.statut || 'prevu',
      usagerNom: form.usagerNom.trim(),
      usagerPrenom: form.usagerPrenom.trim(),
      adresse: form.adresse.trim(),
      commune: form.commune.trim(),
      telephone: form.telephone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      technicien: technicien || undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    saveRdv(rdv)
    refresh()
    setShowForm(false)
    setEditingId(null)
  }

  function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return
    deleteRdv(id)
    refresh()
  }

  function setStatut(id: string, statut: StatutRdv) {
    updateRdvStatut(id, statut)
    refresh()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white pb-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />

      <nav className="relative z-30 bg-[#0e2a52]/90 backdrop-blur-xl text-white px-4 py-3 sm:px-6 shadow-lg ring-1 ring-white/10 sticky top-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm hover:opacity-80">
            <span className="text-xl">←</span>
            <div>
              <div className="font-black text-base sm:text-lg leading-tight">SPANC</div>
              <div className="text-[11px] opacity-70">Planning RDV</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-xl text-sm font-bold"
          >
            + RDV
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Navigation semaine */}
        <section className="spanc-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(addDays(weekStart, -7))}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
            >
              ← Semaine
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(todayISO())}
              className="text-sm font-bold text-orange-300 hover:text-orange-200"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(addDays(weekStart, 7))}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
            >
              Semaine →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day, i) => {
              const active = day === selectedDate
              const isToday = day === todayISO()
              const count = weekCounts[day] || 0
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center rounded-xl py-2 px-1 transition-all ${
                    active
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : isToday
                        ? 'bg-cyan-500/15 ring-1 ring-cyan-400/40 text-cyan-100'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold opacity-80">{WEEKDAYS[i]}</span>
                  <span className="text-base font-black">{day.slice(8)}</span>
                  {count > 0 && (
                    <span className={`mt-0.5 text-[10px] font-bold ${active ? 'text-white' : 'text-orange-300'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">{formatDateFR(selectedDate)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="spanc-input text-sm py-1.5 w-auto"
            />
          </div>
        </section>

        {/* Liste du jour */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg">
              {dayRdvs.length === 0 ? 'Aucun RDV' : `${dayRdvs.length} rendez-vous`}
            </h2>
            <Link
              href={`/nouveau`}
              className="text-xs font-semibold text-cyan-300 underline underline-offset-2"
            >
              Lancer un contrôle →
            </Link>
          </div>

          {dayRdvs.length === 0 && (
            <div className="spanc-card p-6 text-center text-white/60 text-sm space-y-3">
              <p>Aucun rendez-vous pour cette date.</p>
              <button type="button" onClick={openCreate} className="spanc-btn-primary px-4 py-2.5 text-sm">
                Planifier un RDV
              </button>
            </div>
          )}

          {dayRdvs.map(rdv => {
            const typeMeta = TYPE_RDV_LABELS[rdv.type]
            const statutMeta = STATUT_RDV_LABELS[rdv.statut]
            return (
              <article key={rdv.id} className="spanc-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg tabular-nums">
                        {rdv.heure} – {formatHeureFin(rdv.heure, rdv.dureeMin)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${typeMeta.color}`}>
                        {typeMeta.short}
                      </span>
                      <span className={`text-xs font-semibold ${statutMeta.color}`}>
                        {statutMeta.label}
                      </span>
                    </div>
                    <div className="mt-1 font-bold text-white">
                      {[rdv.usagerPrenom, rdv.usagerNom].filter(Boolean).join(' ')}
                    </div>
                    <div className="text-sm text-white/70">
                      {[rdv.adresse, rdv.commune].filter(Boolean).join(', ')}
                    </div>
                    {rdv.telephone && (
                      <a href={`tel:${rdv.telephone}`} className="text-sm text-cyan-300 hover:underline">
                        {rdv.telephone}
                      </a>
                    )}
                    {rdv.notes && (
                      <p className="text-xs text-white/50 mt-1">{rdv.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {rdv.statut !== 'termine' && rdv.statut !== 'annule' && (
                    <>
                      <button type="button" onClick={() => setStatut(rdv.id, 'en_cours')} className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30">
                        En cours
                      </button>
                      <button type="button" onClick={() => setStatut(rdv.id, 'termine')} className="px-2.5 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30">
                        Terminé
                      </button>
                      <button type="button" onClick={() => setStatut(rdv.id, 'annule')} className="px-2.5 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-300 ring-1 ring-red-400/30">
                        Annuler
                      </button>
                    </>
                  )}
                  {rdv.statut === 'annule' && (
                    <button type="button" onClick={() => setStatut(rdv.id, 'prevu')} className="px-2.5 py-1.5 text-xs rounded-lg bg-white/10 text-white/80">
                      Réactiver
                    </button>
                  )}
                  <button type="button" onClick={() => openEdit(rdv)} className="px-2.5 py-1.5 text-xs rounded-lg bg-white/10 text-white/80 hover:bg-white/15">
                    Modifier
                  </button>
                  <button type="button" onClick={() => handleDelete(rdv.id)} className="px-2.5 py-1.5 text-xs rounded-lg text-red-300 hover:bg-red-500/10">
                    Supprimer
                  </button>
                  <Link
                    href={`/nouveau`}
                    className="ml-auto px-2.5 py-1.5 text-xs rounded-lg bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30 font-bold"
                  >
                    Contrôle →
                  </Link>
                </div>
              </article>
            )
          })}
        </section>
      </main>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#102a43] ring-1 ring-white/15 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">
                {editingId ? 'Modifier le RDV' : 'Nouveau rendez-vous'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-white/60 hover:text-white text-xl px-2">
                ×
              </button>
            </div>

            <p className="text-sm text-orange-300/80 font-semibold">{formatDateFR(selectedDate)}</p>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="spanc-label">Heure *</span>
                <input
                  type="time"
                  value={form.heure}
                  onChange={e => setForm(f => ({ ...f, heure: e.target.value }))}
                  className="spanc-input"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="spanc-label">Durée</span>
                <select
                  value={form.dureeMin}
                  onChange={e => setForm(f => ({ ...f, dureeMin: Number(e.target.value) }))}
                  className="spanc-select"
                >
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 h</option>
                  <option value={90}>1 h 30</option>
                  <option value={120}>2 h</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="spanc-label">Type de contrôle</span>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as TypeRdv }))}
                className="spanc-select"
              >
                {(Object.keys(TYPE_RDV_LABELS) as TypeRdv[]).map(t => (
                  <option key={t} value={t}>{TYPE_RDV_LABELS[t].label}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="spanc-label">Prénom</span>
                <input
                  value={form.usagerPrenom}
                  onChange={e => setForm(f => ({ ...f, usagerPrenom: e.target.value }))}
                  className="spanc-input"
                />
              </label>
              <label className="block space-y-1">
                <span className="spanc-label">Nom</span>
                <input
                  value={form.usagerNom}
                  onChange={e => setForm(f => ({ ...f, usagerNom: e.target.value }))}
                  className="spanc-input"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="spanc-label">Adresse</span>
              <input
                value={form.adresse}
                onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                placeholder="15 rue des Champs"
                className="spanc-input"
              />
            </label>

            <CommuneSensCombobox
              value={form.commune}
              onChange={v => setForm(f => ({ ...f, commune: v }))}
              onSelect={c => setForm(f => ({ ...f, commune: c.nom }))}
            />

            <label className="block space-y-1">
              <span className="spanc-label">Téléphone</span>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="spanc-input"
              />
            </label>

            <label className="block space-y-1">
              <span className="spanc-label">Notes</span>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="spanc-input resize-none"
                placeholder="Accès, portail, contact…"
              />
            </label>

            {error && <div className="text-sm text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-xl px-4 py-3">{error}</div>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 spanc-btn-secondary py-3 text-sm">
                Annuler
              </button>
              <button type="submit" className="flex-[2] spanc-btn-primary py-3 text-sm">
                {editingId ? 'Enregistrer' : 'Créer le RDV'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
