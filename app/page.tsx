'use client'
import Link from "next/link"
import { useEffect, useState } from "react"

const AGGLO_SENS_VILLES = [
  'Sens', 'Saint-Clément', 'Paron', 'Saint-Denis-lès-Sens', 'Maillot', 'Malay-le-Grand',
  'Gron', 'Saligny', 'Soucy', 'Étigny', 'Véron', 'Marsangy', 'Nailly', 'Cuy',
  'Passy', 'Rosoy', 'Courtois-sur-Yonne', 'Saint-Martin-du-Tertre', 'Fontaine-la-Gaillarde',
  'Subligny', 'Villeperrot', 'Saint-Martin-sur-Oreuse', 'Évry', 'Vaumort',
  'Thorigny-sur-Oreuse', 'Voisines', 'Les Sièges', 'Villiers-Louis',
]

export default function Home() {
  const [agent, setAgent] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('spanc_agent') : null
    if (saved) setAgent(saved)
  }, [])

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
    } catch (e: any) {
      setLoginError(e.message || 'Erreur')
    } finally {
      setLoggingIn(false)
    }
  }

  function logout() {
    localStorage.removeItem('spanc_agent')
    setAgent(null)
  }


  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />

      {/* Shatter cracks (SVG) — fade in after impact */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-0 cracks-fade-in"
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <g stroke="#1a3a6b" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M400 420 L200 100" />
          <path d="M400 420 L120 200" />
          <path d="M400 420 L600 80" />
          <path d="M400 420 L720 180" />
          <path d="M400 420 L50 500" />
          <path d="M400 420 L750 500" />
          <path d="M400 420 L180 900" />
          <path d="M400 420 L320 980" />
          <path d="M400 420 L500 980" />
          <path d="M400 420 L680 900" />
          <path d="M400 420 L280 300" />
          <path d="M400 420 L520 320" />
          <path d="M400 420 L250 620" />
          <path d="M400 420 L580 630" />
        </g>
      </svg>

      {/* Shockwave ring — expands after impact */}
      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-orange-400 shockwave-ring" />

      {/* Shake wrapper — contenu centré, tient sur un écran */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[100dvh] px-4 sm:px-6 py-4 gap-4 sm:gap-6 shake-on-impact">

        {/* SPANC logo that crashes onto screen */}
        <div className="spanc-drop text-center relative">
          {/* Halo lumineux derrière le logo */}
          <div className="halo-glow" aria-hidden />
          {/* Anneaux décoratifs qui tournent */}
          <div className="ring-spin ring-outer" aria-hidden />
          <div className="ring-spin ring-inner" aria-hidden />

          <img
            src="/logo.png"
            alt="SPANC SENS"
            className="relative mx-auto w-auto max-w-[80vw] max-h-[45vh] sm:max-h-[50vh] h-auto drop-shadow-[0_12px_40px_rgba(0,200,255,0.45)] logo-pulse"
          />
          <div className="mt-3 text-[9px] sm:text-[11px] md:text-xs uppercase tracking-[0.35em] sm:tracking-[0.4em] text-orange-300/80 font-bold">
            Spécialiste SPANC · Agglo de Sens
          </div>
        </div>

        {/* Bandeau défilant des communes */}
        <div className="w-full marquee-strip buttons-reveal" aria-label="Communes desservies — CA du Grand Sénonais">
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

        {/* Zone agent : code ou bouton */}
        <div className="w-full max-w-md mx-auto buttons-reveal">

          {/* Avant hydratation, on n'affiche rien (évite mismatch SSR) */}
          {hydrated && !agent && (
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

          {hydrated && agent && (
            <>
              <div className="mb-3 flex items-center justify-between text-xs gap-2 flex-wrap">
                <span className="text-white/70">
                  Connecté · <span className="font-bold text-orange-300">{agent}</span>
                </span>
                <div className="flex items-center gap-3">
                  <Link href="/telecharger" className="text-cyan-300 hover:text-cyan-200 font-semibold underline underline-offset-2">
                    💻 Installer
                  </Link>
                  <button onClick={logout} className="text-white/60 hover:text-white underline underline-offset-2">
                    Déconnexion
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <ModuleCard
                  href="/nouveau"
                  title="Nouveau contrôle"
                  subtitle="Périodique · Conception · Exécution · Vente"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7 text-white">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  }
                  iconBg="from-blue-400 to-blue-600"
                  iconShadow="rgba(59,130,246,0.6)"
                />

                <ModuleCard
                  href="/dossiers"
                  title="Dossiers usagers"
                  subtitle="Recherche par adresse · Cadastre"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7 text-white">
                      <path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                      <path d="M9 13h6" />
                      <path d="M9 17h4" />
                    </svg>
                  }
                  iconBg="from-emerald-400 to-emerald-600"
                  iconShadow="rgba(16,185,129,0.55)"
                />

                <ModuleCard
                  href="/attestation"
                  title="Attestation de conformité"
                  subtitle="Conforme · Non-conforme · Vente"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7 text-white">
                      <path d="M12 3v18" />
                      <path d="M5 21h14" />
                      <path d="M5 7l-3 5h6l-3-5z" />
                      <path d="M19 7l-3 5h6l-3-5z" />
                      <path d="M5 7h14" />
                    </svg>
                  }
                  iconBg="from-orange-400 to-orange-600"
                  iconShadow="rgba(249,115,22,0.6)"
                />

                <ModuleCard
                  href="/sispea"
                  title="Export SISPEA"
                  subtitle="RPQS ANC · Fichier CSV pour import"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7 text-white">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M12 18v-6" />
                      <path d="m9 15 3 3 3-3" />
                    </svg>
                  }
                  iconBg="from-violet-400 to-violet-600"
                  iconShadow="rgba(139,92,246,0.55)"
                />

                <ModuleCard
                  href="/cartographie"
                  title="Cartographie intégrée"
                  subtitle="Schéma ANC sur fond cadastral"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7 text-white">
                      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
                      <path d="M9 3v15" />
                      <path d="M15 6v15" />
                    </svg>
                  }
                  iconBg="from-cyan-400 to-cyan-600"
                  iconShadow="rgba(6,182,212,0.55)"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        /* ===== SPANC drop animation =====
           Commence hors écran tout en haut, petite pause, tombe rapidement
           avec rotation puis atterrit en place. */
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

        /* ===== Shake écran après impact ===== */
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
        .shake-on-impact {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) 1.45s;
        }

        /* ===== Onde de choc orange ===== */
        @keyframes shockwave {
          0%   { width: 0; height: 0; opacity: 0; border-width: 8px; }
          20%  { opacity: 0; }
          25%  { opacity: 0.95; width: 20px; height: 20px; border-width: 8px; }
          100% { width: 150vw; height: 150vw; opacity: 0; border-width: 0; }
        }
        .shockwave-ring {
          width: 0;
          height: 0;
          opacity: 0;
          animation: shockwave 1.4s ease-out 1.4s forwards;
        }

        /* ===== Fissures bleues qui apparaissent ===== */
        @keyframes cracksFade {
          0%, 70% { opacity: 0; }
          100%    { opacity: 0.55; }
        }
        .cracks-fade-in {
          animation: cracksFade 1.2s ease-out 1.4s forwards;
        }

        /* ===== Boutons qui montent après l'impact ===== */
        @keyframes buttonsUp {
          0%, 70% { opacity: 0; transform: translateY(40px); pointer-events: none; }
          100%    { opacity: 1; transform: translateY(0); pointer-events: auto; }
        }
        .buttons-reveal {
          opacity: 0;
          transform: translateY(40px);
          pointer-events: none;
          animation: buttonsUp 0.7s ease-out 1.75s forwards;
        }

        /* ===== Logo : pulsation lumineuse continue ===== */
        @keyframes logoPulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 220, 180, 0.5)); }
          50%      { filter: drop-shadow(0 0 35px rgba(0, 200, 255, 0.9)); }
        }
        .logo-pulse {
          animation: logoPulse 3s ease-in-out 2.2s infinite;
        }

        /* ===== Halo lumineux derrière le logo ===== */
        @keyframes haloPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.5; }
          50%      { transform: translate(-50%, -50%) scale(1.2); opacity: 0.85; }
        }
        .halo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 480px;
          height: 480px;
          max-width: 80vw;
          max-height: 50vh;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(0,220,200,0.28) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          animation: haloPulse 4s ease-in-out 2s infinite, fadeIn 0.6s ease-out 1.9s forwards;
          z-index: -1;
        }

        /* ===== Anneaux décoratifs qui tournent ===== */
        @keyframes spinCW   { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes spinCCW  { to { transform: translate(-50%, -50%) rotate(-360deg); } }
        @keyframes fadeIn   { to { opacity: 1; } }

        .ring-spin {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          z-index: -1;
        }
        .ring-outer {
          width: 440px;
          height: 440px;
          max-width: 75vw;
          max-height: 48vh;
          border: 2px dashed rgba(0, 220, 200, 0.4);
          transform: translate(-50%, -50%);
          animation: spinCW 20s linear 2s infinite, fadeIn 0.6s ease-out 1.9s forwards;
        }
        .ring-inner {
          width: 380px;
          height: 380px;
          max-width: 65vw;
          max-height: 42vh;
          border: 1px dotted rgba(100, 200, 255, 0.55);
          transform: translate(-50%, -50%);
          animation: spinCCW 12s linear 2s infinite, fadeIn 0.6s ease-out 1.9s forwards;
        }

        /* ===== Bandeau défilant — communes ===== */
        .marquee-strip {
          position: relative;
          overflow: hidden;
          padding: 8px 0;
          background: linear-gradient(
            90deg,
            rgba(14, 42, 82, 0.6) 0%,
            rgba(14, 42, 82, 0.3) 50%,
            rgba(14, 42, 82, 0.6) 100%
          );
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 60s linear infinite;
        }
        .marquee-content {
          display: inline-flex;
          flex-shrink: 0;
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-strip:hover .marquee-track {
          animation-play-state: paused;
        }

        /* ===== CTA Button — bordure conique animée ===== */
        @keyframes spinBorder {
          to { transform: rotate(360deg); }
        }
        .cta-button {
          position: relative;
          isolation: isolate;
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease;
          box-shadow:
            0 10px 30px -10px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow:
            0 25px 60px -15px rgba(249, 115, 22, 0.45),
            0 0 40px -10px rgba(0, 220, 200, 0.35);
        }
        .cta-button:active {
          transform: translateY(-1px) scale(0.99);
        }
        .cta-border {
          position: absolute;
          inset: -150%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(0, 220, 200, 0.6) 60deg,
            transparent 120deg,
            transparent 240deg,
            rgba(249, 115, 22, 0.7) 300deg,
            transparent 360deg
          );
          animation: spinBorder 6s linear infinite;
          z-index: 0;
        }

        /* ===== Halo derrière l'icône ===== */
        .cta-icon-glow {
          position: absolute;
          inset: -30%;
          background: radial-gradient(circle, rgba(249,115,22,0.5), transparent 70%);
          filter: blur(15px);
          opacity: 0.6;
          transition: opacity 0.4s ease;
        }
        .cta-button:hover .cta-icon-glow {
          opacity: 1;
        }

        /* ===== Shimmer qui balaye au survol ===== */
        @keyframes shimmerSweep {
          0%   { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        .cta-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 40%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.12) 50%,
            transparent 100%
          );
          transform: translateX(-150%) skewX(-20deg);
          opacity: 0;
        }
        .cta-button:hover .cta-shimmer {
          opacity: 1;
          animation: shimmerSweep 1.2s ease-out;
        }

        /* Respecter la préférence utilisateur "reduced motion" */
        @media (prefers-reduced-motion: reduce) {
          .spanc-drop, .shake-on-impact, .shockwave-ring, .cracks-fade-in, .buttons-reveal,
          .logo-pulse, .halo-glow, .ring-spin, .cta-border, .cta-shimmer, .marquee-track {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            pointer-events: auto !important;
          }
          .cracks-fade-in { opacity: 0.5 !important; }
          .halo-glow      { opacity: 0.6 !important; transform: translate(-50%, -50%) !important; }
          .ring-outer, .ring-inner { transform: translate(-50%, -50%) !important; opacity: 0.4 !important; }
          .cta-shimmer    { opacity: 0 !important; }
        }
      `}</style>
    </main>
  )
}

function ModuleCard({
  href, title, subtitle, icon, iconBg, iconShadow,
}: {
  href: string
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  iconShadow: string
}) {
  return (
    <Link
      href={href}
      className="cta-button group relative block overflow-hidden rounded-2xl p-px"
      aria-label={title}
    >
      <span className="cta-border" aria-hidden />
      <span className="relative flex items-center gap-3 sm:gap-4 rounded-[15px] bg-gradient-to-br from-[#0e2a52]/85 via-[#102a43]/85 to-[#071026]/90 px-4 sm:px-5 py-3.5 sm:py-4 backdrop-blur-xl ring-1 ring-white/10">
        <span className="relative shrink-0">
          <span className="cta-icon-glow" aria-hidden />
          <span
            className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconBg} ring-1 ring-white/20 group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-500`}
            style={{ boxShadow: `0 8px 25px -5px ${iconShadow}` }}
          >
            {icon}
          </span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-base sm:text-lg font-bold text-white leading-tight uppercase tracking-wide">
            {title}
          </span>
          <span className="block text-[11px] sm:text-xs text-white/60 mt-0.5 truncate">
            {subtitle}
          </span>
        </span>
        <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 text-white group-hover:bg-orange-500 group-hover:ring-orange-400 group-hover:translate-x-1 transition-all duration-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
        <span className="cta-shimmer pointer-events-none" aria-hidden />
      </span>
    </Link>
  )
}
