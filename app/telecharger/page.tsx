'use client'

import Link from 'next/link'
import InstallAppButton from '@/components/InstallAppButton'

const APP_URL = 'https://spanc-sens.vercel.app'

export default function TelechargerPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a1a3d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />

      <nav className="relative z-20 bg-[#0e2a52]/90 backdrop-blur-xl px-4 py-3 shadow-lg ring-1 ring-white/10 sticky top-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-xl hover:opacity-80">←</Link>
          <div>
            <div className="font-black text-lg uppercase tracking-wide">Installer SPANC</div>
            <div className="text-xs text-orange-300/80">Mac · Windows · tablette</div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">
        <section className="spanc-card p-6 space-y-4 text-center">
          <div className="text-5xl">💻</div>
          <h1 className="text-2xl font-black">Logiciel SPANC sur votre ordinateur</h1>
          <p className="text-sm text-white/70 leading-relaxed">
            SPANC fonctionne comme une application de bureau : icône dans le Dock (Mac) ou le menu Démarrer (Windows),
            fenêtre dédiée, sans barre d&apos;adresse du navigateur.
          </p>
          <div className="flex flex-col items-center gap-3 pt-2">
            <InstallAppButton label="Installer SPANC (recommandé)" className="w-full sm:w-auto" />
            <p className="text-xs text-white/50">
              Bouton visible sur Chrome et Edge. Sinon, suivez les instructions ci-dessous.
            </p>
          </div>
        </section>

        <section className="spanc-card p-5 space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2">🍎 Sur Mac</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-white/80">
            <li>
              Ouvrez <a href={APP_URL} className="text-cyan-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{APP_URL}</a> dans <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
            </li>
            <li>
              Menu <strong>Fichier → Installer SPANC…</strong> (Chrome) ou icône <strong>⊕ Installer</strong> dans la barre d&apos;adresse (Edge).
            </li>
            <li>L&apos;application apparaît dans le <strong>Launchpad</strong> et le <strong>Dock</strong>.</li>
          </ol>
          <p className="text-xs text-white/50 border-t border-white/10 pt-3">
            Safari : Partager → <strong>Ajouter au Dock</strong> (raccourci web, même principe).
          </p>
        </section>

        <section className="spanc-card p-5 space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2">🪟 Sur Windows (PC)</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-white/80">
            <li>
              Ouvrez <a href={APP_URL} className="text-cyan-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{APP_URL}</a> dans <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
            </li>
            <li>
              Cliquez sur l&apos;icône <strong>Installer</strong> (⊕) à droite de la barre d&apos;adresse, ou menu <strong>⋮ → Installer SPANC…</strong>.
            </li>
            <li>L&apos;application est ajoutée au <strong>menu Démarrer</strong> et peut être épinglée à la barre des tâches.</li>
          </ol>
        </section>

        <section className="spanc-card p-5 space-y-3">
          <h2 className="font-black text-lg">📦 Version bureau (.app / .exe)</h2>
          <p className="text-sm text-white/70">
            Une version empaquetée Electron (installateur Mac .dmg ou Windows .exe) peut être compilée
            depuis le dossier <code className="text-orange-200">desktop/</code> du projet.
            Contactez l&apos;administrateur pour obtenir le fichier d&apos;installation ou lancez :
          </p>
          <pre className="text-xs bg-black/30 rounded-xl p-4 overflow-x-auto text-emerald-200/90 ring-1 ring-white/10">
{`cd desktop
npm install
npm run build:mac    # Mac → fichier .dmg
npm run build:win    # Windows → fichier .exe`}
          </pre>
        </section>

        <section className="text-blue-200 bg-blue-500/10 ring-1 ring-blue-400/30 rounded-2xl p-4 text-sm space-y-2">
          <p className="font-bold text-blue-100">Connexion internet requise</p>
          <p className="text-blue-100/90">
            L&apos;application installée se connecte au serveur SPANC en ligne. Vos données terrain (plans, dossiers)
            restent enregistrées localement dans le navigateur de l&apos;appareil.
          </p>
        </section>
      </div>
    </main>
  )
}
