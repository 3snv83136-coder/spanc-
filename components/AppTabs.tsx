'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: '/nouveau', label: 'Rapport d\'intervention', icon: '📄' },
  { href: '/devis', label: 'Devis', icon: '🧾' },
]

export default function AppTabs() {
  const pathname = usePathname() || ''
  return (
    <div className="mx-auto mb-3 flex max-w-fit gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
      {TABS.map(t => {
        const active = pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              active
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="mr-1">{t.icon}</span>{t.label}
          </Link>
        )
      })}
    </div>
  )
}
