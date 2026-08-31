'use client'

import Link from 'next/link'

interface SpancShellProps {
  title: string
  subtitle?: string
  backHref?: string
  children: React.ReactNode
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  footer?: React.ReactNode
  className?: string
  showGrid?: boolean
}

const MAX_W = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-full',
}

export default function SpancShell({
  title,
  subtitle,
  backHref = '/',
  children,
  maxWidth = '3xl',
  footer,
  className = '',
  showGrid = true,
}: SpancShellProps) {
  const mw = MAX_W[maxWidth]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />

      {showGrid && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
          viewBox="0 0 800 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <g stroke="#4a9eff" strokeWidth="0.75" fill="none">
            <path d="M0 200 L800 400" />
            <path d="M0 400 L800 200" />
            <path d="M0 600 L800 800" />
            <path d="M0 800 L800 600" />
            <path d="M200 0 L400 1000" />
            <path d="M400 0 L600 1000" />
            <path d="M600 0 L800 1000" />
          </g>
        </svg>
      )}

      <nav className="relative z-30 bg-[#0e2a52]/90 px-4 py-3 shadow-lg ring-1 ring-white/10 backdrop-blur-xl sm:px-6 sm:py-4 sticky top-0">
        <div className={`${mw} mx-auto flex items-center gap-3`}>
          <Link href={backHref} className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
            <span className="text-xl leading-none">←</span>
            <div>
              <div className="text-base font-black uppercase leading-tight tracking-wide sm:text-lg">SPANC</div>
              <div className="text-[11px] opacity-70">{subtitle ?? title}</div>
            </div>
          </Link>
        </div>
      </nav>

      <main className={`relative z-10 ${mw} mx-auto px-4 py-5 pb-32 ${className}`}>
        {children}
      </main>

      {footer}
    </div>
  )
}
