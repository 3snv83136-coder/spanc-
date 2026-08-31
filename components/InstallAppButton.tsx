'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallAppButton({
  className = '',
  label = 'Installer l\'application',
}: {
  className?: string
  label?: string
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    if ((navigator as Navigator & { standalone?: boolean }).standalone) {
      setInstalled(true)
      return
    }

    const onInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => window.removeEventListener('beforeinstallprompt', onInstall)
  }, [])

  async function handleInstall() {
    if (!deferred) return
    setInstalling(true)
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
      setDeferred(null)
    } finally {
      setInstalling(false)
    }
  }

  if (installed) {
    return (
      <span className={`inline-flex items-center gap-2 text-emerald-300 text-sm font-semibold ${className}`}>
        ✓ Application installée
      </span>
    )
  }

  if (!deferred) return null

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={installing}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white shadow-lg shadow-orange-500/30 transition-colors hover:bg-orange-600 disabled:opacity-60 ${className}`}
    >
      {installing ? 'Installation…' : `⬇ ${label}`}
    </button>
  )
}
