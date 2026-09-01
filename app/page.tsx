'use client'
import Link from "next/link"
import { useEffect, useState } from "react"
import { useOffline } from "@/components/OfflineProvider"
import { TYPE_RDV_LABELS, formatHeureFin, type RendezVous } from "@/lib/types/planning"
import { countRdvsToday, getRdvsToday, getUpcomingRdvs } from "@/lib/planning/storage"

const AGGLO_SENS_VILLES = [
  'Sens', 'Saint-Clément', 'Paron', 'Saint-Denis-lès-Sens', 'Maillot', 'Malay-le-Grand',
  'Gron', 'Saligny', 'Soucy', 'Étigny', 'Véron', 'Marsangy', 'Nailly', 'Cuy',
  'Passy', 'Rosoy', 'Courtois-sur-Yonne', 'Saint-Martin-du-Tertre', 'Fontaine-la-Gaillarde',
  'Subligny', 'Villeperrot', 'Saint-Martin-sur-Oreuse', 'Évry', 'Vaumort',
  'Thorigny-sur-Oreuse', 'Voisines', 'Les Sièges', 'Villiers-Louis',
]

type ModuleDef = {
  href: string
  title: string
  subtitle: string
  badge?: string
  iconBg: string
  iconShadow: string
  icon: React.ReactNode
}

const ICON = {
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M12 5v14" /><path d="M5 12h14" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15" /><path d="M15 6v15" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M9 13h6" /><path d="M9 17h4" />
    </svg>
  ),
  seal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M12 3v18" /><path d="M5 21h14" />
      <path d="M5 7l-3 5h6l-3-5z" /><path d="M19 7l-3 5h6l-3-5z" /><path d="M5 7h14" />
    </svg>
  ),
  export: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" /><path d="M12 15V3" />
    </svg>
  ),
  sync: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M21 12a9 9 0 0 0-15-6.7L3 8" /><path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 15 6.7L21 16" /><path d="M21 21v-5h-5" />
    </svg>
  ),
}

export default function Home() {
  const { pendingCount } = useOffline()
  const [agent, setAgent] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [todayRdvs, setTodayRdvs] = useState<RendezVous[]>([])
  const [upcoming, setUpcoming] = useState<RendezVous[]>([])
  const [rdvCount, setRdvCount] = useState(0)

  useEffect(() => {
    setHydrated(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('spanc_agent') : null
    if (saved) setAgent(saved)
  }, [])

  useEffect(() => {
    if (!agent) return
    setTodayRdvs(getRdvsToday())
    setUpcoming(getUpcomingRdvs(3))
    setRdvCount(countRdvsToday())
  }, [agent])

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    if (!code.trim()) return
    setLoggingIn(true)
    try {
      const res = await fetch('/api/agent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Code invalide')
      localStorage.setItem('spanc_agent', json.name)
      setAgent(json.name)
      setCode('')
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoggingIn(false)
    }
  }

  function logout() {
    localStorage.removeItem('spanc_agent')
    setAgent(null)
  }

  const terrainModules: ModuleDef[] = [
    {
      href: '/nouveau',
      title: 'Nouveau contrôle',
      subtitle: 'Périodique · Conception · Exécution · Vente',
      iconBg: 'from-blue-400 to-blue-600',
      iconShadow: 'rgba(59,130,246,0.55)',
      icon: ICON.plus,
    },
    {
      href: '/planning',
      title: 'Planning RDV',
      subtitle: rdvCount > 0 ? `${rdvCount} rendez-vous aujourd'hui` : 'Agenda des contrôles terrain',
      badge: rdvCount > 0 ? String(rdvCount) : undefined,
      iconBg: 'from-amber-400 to-orange-500',
      iconShadow: 'rgba(249,115,22,0.55)',
      icon: ICON.calendar,
    },
    {
      href: '/cartographie',
      title: 'Cartographie',
      subtitle: 'Schéma ANC sur fond cadastral',
      iconBg: 'from-cyan-400 to-cyan-600',
      iconShadow: 'rgba(6,182,212,0.55)',
      icon: ICON.map,
    },
  ]

  const docsModules: ModuleDef[] = [
    {
      href: '/dossiers',
      title: 'Dossiers usagers',
      subtitle: 'Recherche adresse · Cadastre',
      iconBg: 'from-emerald-400 to-emerald-600',
      iconShadow: 'rgba(16,185,129,0.5)',
      icon: ICON.folder,
    },
    {
      href: '/formulaires',
      title: 'Formulaires client',
      subtitle: 'Conception · Diagnostic · Envoi e-mail',
      iconBg: 'from-rose-400 to-pink-600',
      iconShadow: 'rgba(244,63,94,0.55)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="m22 6-10 7L2 6" />
        </svg>
      ),
    },
    {
      href: '/attestation',
      title: 'Attestation',
      subtitle: 'Conformité · Vente immobilière',
      iconBg: 'from-orange-400 to-orange-600',
      iconShadow: 'rgba(249,115,22,0.55)',
      icon: ICON.seal,
    },
  ]

  const adminModules: ModuleDef[] = [
    {
      href: '/sispea',
      title: 'Export SISPEA',
      subtitle: 'RPQS ANC · Fichier CSV',
      iconBg: 'from-violet-400 to-violet-600',
      iconShadow: 'rgba(139,92,246,0.5)',
      icon: ICON.export,
    },
    {
      href: '/telecharger',
      title: 'Installer l\'app',
      subtitle: 'Mac · Windows · tablette',
      iconBg: 'from-slate-400 to-slate-600',
      iconShadow: 'rgba(148,163,184,0.45)',
      icon: ICON.download,
    },
  ]

  if (pendingCount > 0) {
    adminModules.unshift({
      href: '/sync',
      title: 'Synchronisation',
      subtitle: `${pendingCount} action(s) en attente`,
      badge: String(pendingCount),
      iconBg: 'from-amber-400 to-amber-600',
      iconShadow: 'rgba(245,158,11,0.5)',
      icon: ICON.sync,
    })
  }

  // ——— Écran login (logo animé) ———
  if (!hydrated || !agent) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
        <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-0 cracks-fade-in" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g stroke="#1a3a6b" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <path d="M400 420 L200 100" /><path d="M400 420 L120 200" /><path d="M400 420 L600 80" />
            <path d="M400 420 L720 180" /><path d="M400 420 L50 500" /><path d="M400 420 L750 500" />
            <path d="M400 420 L180 900" /><path d="M400 420 L320 980" /><path d="M400 420 L500 980" />
            <path d="M400 420 L680 900" />
          </g>
        </svg>
        <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-orange-400 shockwave-ring" />

        <div className="relative z-10 flex flex-col items-center justify-center h-[100dvh] px-4 sm:px-6 py-4 gap-4 sm:gap-6 shake-on-impact">
          <div className="spanc-drop text-center relative">
            <div className="halo-glow" aria-hidden />
            <div className="ring-spin ring-outer" aria-hidden />
            <div className="ring-spin ring-inner" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="SPANC SENS"
              className="relative mx-auto w-auto max-w-[80vw] max-h-[40vh] sm:max-h-[45vh] h-auto drop-shadow-[0_12px_40px_rgba(0,200,255,0.45)] logo-pulse"
            />
            <div className="mt-3 text-[9px] sm:text-[11px] uppercase tracking-[0.35em] text-orange-300/80 font-bold">
              Spécialiste SPANC · Agglo de Sens
            </div>
          </div>

          <div className="w-full marquee-strip buttons-reveal" aria-label="Communes desservies">
            <div className="marquee-track">
              <span className="marquee-content">
                {[...AGGLO_SENS_VILLES, ...AGGLO_SENS_VILLES].map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-3 px-4">
                    <span className="text-orange-400">●</span>
                    <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">{v}</span>
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto buttons-reveal">
            {hydrated && (
              <form
                onSubmit={submitCode}
                className="rounded-2xl bg-gradient-to-br from-[#0e2a52]/85 via-[#102a43]/85 to-[#071026]/90 backdrop-blur-xl ring-1 ring-white/10 p-5 sm:p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
              >
                <label className="block text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-orange-300/80 font-semibold mb-2">
                  Code d&apos;accès agent
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="••••"
                    className="flex-1 bg-white/5 ring-1 ring-white/15 focus:ring-orange-400 outline-none rounded-xl px-4 py-3 text-white tracking-[0.4em] text-center font-bold placeholder-white/30"
                    aria-label="Code d'accès"
                  />
                  <button
                    type="submit"
                    disabled={loggingIn || !code.trim()}
                    className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold transition-colors"
                  >
                    {loggingIn ? '…' : 'Entrer'}
                  </button>
                </div>
                {loginError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 ring-1 ring-red-400/30 rounded-lg px-3 py-2">
                    {loginError}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
        <HomeStyles />
      </main>
    )
  }

  // ——— Tableau de bord agent ———
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />

      <header className="relative z-20 sticky top-0 bg-[#0e2a52]/90 backdrop-blur-xl ring-1 ring-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-9 w-auto opacity-90" />
            <div className="min-w-0">
              <div className="font-black text-sm uppercase tracking-wide truncate">SPANC Sens</div>
              <div className="text-[11px] text-orange-300/80 truncate">
                {agent}
              </div>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-white/60 hover:text-white underline underline-offset-2 shrink-0">
            Déconnexion
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-5 space-y-6 pb-12">
        {/* Aperçu planning du jour */}
        <section className="rounded-2xl bg-gradient-to-br from-[#0e2a52]/85 via-[#102a43]/85 to-[#071026]/90 backdrop-blur-xl ring-1 ring-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-black text-base uppercase tracking-wide">Aujourd&apos;hui</h2>
              <p className="text-xs text-white/60">
                {todayRdvs.length === 0 ? 'Aucun rendez-vous' : `${todayRdvs.length} rendez-vous`}
              </p>
            </div>
            <Link href="/planning" className="text-xs font-bold text-orange-300 hover:text-orange-200 underline underline-offset-2">
              Voir le planning →
            </Link>
          </div>

          {todayRdvs.length > 0 ? (
            <ul className="space-y-2">
              {todayRdvs.slice(0, 3).map(rdv => (
                <li key={rdv.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
                  <span className="font-black tabular-nums text-orange-300 w-12 shrink-0">{rdv.heure}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">
                      {[rdv.usagerPrenom, rdv.usagerNom].filter(Boolean).join(' ')}
                    </span>
                    <span className="block text-[11px] text-white/55 truncate">
                      {TYPE_RDV_LABELS[rdv.type].short} · {rdv.commune || rdv.adresse}
                      {' · '}{rdv.heure}–{formatHeureFin(rdv.heure, rdv.dureeMin)}
                    </span>
                  </span>
                </li>
              ))}
              {todayRdvs.length > 3 && (
                <li className="text-center text-xs text-white/50">+ {todayRdvs.length - 3} autre(s)</li>
              )}
            </ul>
          ) : upcoming.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-white/50">Prochains RDV</p>
              {upcoming.map(rdv => (
                <div key={rdv.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 text-sm">
                  <span className="text-xs text-white/50 w-16 shrink-0">{rdv.date.slice(8)}/{rdv.date.slice(5, 7)}</span>
                  <span className="font-bold text-orange-300 w-12">{rdv.heure}</span>
                  <span className="truncate text-white/80">{[rdv.usagerPrenom, rdv.usagerNom].filter(Boolean).join(' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <Link
              href="/planning"
              className="block text-center rounded-xl border border-dashed border-white/20 py-4 text-sm text-white/60 hover:border-orange-400/40 hover:text-orange-200 transition-colors"
            >
              + Planifier un rendez-vous
            </Link>
          )}
        </section>

        {/* Groupes de modules */}
        <ModuleGroup title="1 · Terrain" hint="Contrôles et déplacements">
          {terrainModules.map(m => <ModuleTile key={m.href} {...m} />)}
        </ModuleGroup>

        <ModuleGroup title="2 · Documents" hint="Dossiers et attestations">
          {docsModules.map(m => <ModuleTile key={m.href} {...m} />)}
        </ModuleGroup>

        <ModuleGroup title="3 · Administration" hint="Exports et installation">
          {adminModules.map(m => <ModuleTile key={m.href} {...m} />)}
        </ModuleGroup>
      </div>
      <HomeStyles />
    </main>
  )
}

function ModuleGroup({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="px-1">
        <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300/90">{title}</h2>
        <p className="text-xs text-white/50 mt-0.5">{hint}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {children}
      </div>
    </section>
  )
}

function ModuleTile({ href, title, subtitle, badge, icon, iconBg, iconShadow }: ModuleDef) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#0e2a52]/90 via-[#102a43]/90 to-[#071026]/95 px-3.5 py-3.5 ring-1 ring-white/10 hover:ring-orange-400/40 hover:bg-white/[0.04] transition-all"
      aria-label={title}
    >
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} ring-1 ring-white/20 group-hover:scale-105 transition-transform`}
        style={{ boxShadow: `0 6px 18px -4px ${iconShadow}` }}
      >
        {icon}
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-[10px] font-black text-white flex items-center justify-center ring-2 ring-[#0a1a3d]">
            {badge}
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-white leading-tight">{title}</span>
        <span className="block text-[11px] text-white/55 mt-0.5 truncate">{subtitle}</span>
      </span>
      <span className="shrink-0 text-white/30 group-hover:text-orange-300 transition-colors">→</span>
    </Link>
  )
}

function HomeStyles() {
  return (
    <style jsx global>{`
      @keyframes spancDrop {
        0%   { opacity: 0; transform: translateY(-120vh) rotate(-8deg) scale(1.5); }
        30%  { opacity: 0; transform: translateY(-120vh) rotate(-8deg) scale(1.5); }
        75%  { opacity: 1; transform: translateY(8px) rotate(2deg) scale(1.02); }
        85%  { transform: translateY(-4px) rotate(-1deg) scale(1); }
        100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
      }
      .spanc-drop {
        opacity: 0;
        animation: spancDrop 1.6s cubic-bezier(.45,.05,.2,1) 0.3s forwards;
        will-change: transform, opacity;
      }
      @keyframes shake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-4px, 2px); }
        20% { transform: translate(4px, -2px); }
        30% { transform: translate(-3px, 2px); }
        40% { transform: translate(3px, -2px); }
        50% { transform: translate(-2px, 1px); }
        60% { transform: translate(2px, -1px); }
        70% { transform: translate(-1px, 1px); }
        80% { transform: translate(1px, 0); }
      }
      .shake-on-impact { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) 1.45s; }
      @keyframes shockwave {
        0%   { width: 0; height: 0; opacity: 0; border-width: 8px; }
        20%  { opacity: 0; }
        25%  { opacity: 0.95; width: 20px; height: 20px; border-width: 8px; }
        100% { width: 150vw; height: 150vw; opacity: 0; border-width: 0; }
      }
      .shockwave-ring {
        width: 0; height: 0; opacity: 0;
        animation: shockwave 1.2s ease-out 1.45s forwards;
      }
      @keyframes cracksFade {
        0%, 70% { opacity: 0; }
        85% { opacity: 0.55; }
        100% { opacity: 0.35; }
      }
      .cracks-fade-in { animation: cracksFade 2.2s ease-out forwards; }
      @keyframes buttonsReveal {
        0%, 70% { opacity: 0; transform: translateY(18px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .buttons-reveal {
        opacity: 0;
        animation: buttonsReveal 0.7s ease-out 1.7s forwards;
      }
      @keyframes logoPulse {
        0%, 100% { filter: drop-shadow(0 12px 40px rgba(0,200,255,0.35)); }
        50% { filter: drop-shadow(0 12px 50px rgba(0,200,255,0.55)); }
      }
      .logo-pulse { animation: logoPulse 3s ease-in-out infinite; }
      .halo-glow {
        position: absolute; left: 50%; top: 45%;
        width: 70%; height: 70%;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, rgba(0,180,255,0.35), transparent 70%);
        filter: blur(28px); z-index: 0; pointer-events: none;
      }
      @keyframes ringSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
      .ring-spin {
        position: absolute; left: 50%; top: 45%;
        border-radius: 50%; border: 1px solid rgba(255,255,255,0.12);
        transform: translate(-50%, -50%); pointer-events: none; z-index: 0;
      }
      .ring-outer { width: 85%; height: 85%; animation: ringSpin 28s linear infinite; }
      .ring-inner { width: 65%; height: 65%; animation: ringSpin 18s linear infinite reverse; border-color: rgba(249,115,22,0.2); }
      .marquee-strip { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
      .marquee-track { display: flex; width: max-content; animation: marquee 45s linear infinite; }
      .marquee-content { display: flex; white-space: nowrap; }
      @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @media (prefers-reduced-motion: reduce) {
        .spanc-drop, .shake-on-impact, .shockwave-ring, .cracks-fade-in, .buttons-reveal,
        .logo-pulse, .halo-glow, .ring-spin, .marquee-track {
          animation: none !important; opacity: 1 !important; transform: none !important;
        }
        .cracks-fade-in { opacity: 0.5 !important; }
        .halo-glow { opacity: 0.6 !important; transform: translate(-50%, -50%) !important; }
        .ring-outer, .ring-inner { transform: translate(-50%, -50%) !important; opacity: 0.4 !important; }
      }
    `}</style>
  )
}
