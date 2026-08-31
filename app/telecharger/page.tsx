'use client'

import Link from 'next/link'
import InstallAppButton from '@/components/InstallAppButton'

const APP_URL = 'https://spanc-sens.vercel.app'
const MAC_DMG = '/downloads/SPANC-Sens-mac-arm64.dmg'
const MAC_VERSION = '1.0.0'
const MAC_SIZE = '95 Mo'

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
              Bouton visible sur Chrome et Edge. Sinon, téléchargez l&apos;installateur ci-dessous.
            </p>
          </div>
        </section>

        <section className="spanc-card p-5 space-y-4 ring-2 ring-orange-400/30">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🍎</span>
            <div className="flex-1 space-y-1">
              <h2 className="font-black text-lg">Télécharger pour Mac</h2>
              <p className="text-sm text-white/70">
                Installateur <strong>.dmg</strong> · version {MAC_VERSION} · {MAC_SIZE} · Mac Apple Silicon (M1/M2/M3)
              </p>
            </div>
          </div>
          <a
            href={MAC_DMG}
            download="SPANC-Sens-mac.dmg"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-white shadow-lg shadow-orange-500/30 transition-colors hover:bg-orange-600 active:scale-[0.99]"
          >
            ⬇ Télécharger SPANC pour Mac (.dmg)
          </a>
          <ol className="list-decimal list-inside space-y-2 text-sm text-white/80 border-t border-white/10 pt-4">
            <li>Ouvrez le fichier <strong>SPANC-Sens-mac-arm64.dmg</strong> téléchargé.</li>
            <li>Glissez <strong>SPANC Sens</strong> dans le dossier <strong>Applications</strong>.</li>
            <li>
              Si macOS bloque l&apos;ouverture : <strong>Réglages Système → Confidentialité et sécurité → Ouvrir quand même</strong>.
            </li>
          </ol>
        </section>

        <section className="spanc-card p-5 space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2">🍎 Installation via navigateur (Mac)</h2>
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
          <p className="text-sm text-white/70">
            Utilisez l&apos;installation via navigateur (Chrome ou Edge) — même principe que sur Mac :
          </p>
          <ol className="list-decimal list-inside space-y-3 text-sm text-white/80">
            <li>
              Ouvrez <a href={APP_URL} className="text-cyan-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{APP_URL}</a> dans <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
            </li>
            <li>
              Cliquez sur l&apos;icône <strong>Installer</strong> (⊕) à droite de la barre d&apos;adresse, ou menu <strong>⋮ → Installer SPANC…</strong>.
            </li>
            <li>L&apos;application est ajoutée au <strong>menu Démarrer</strong> et peut être épinglée à la barre des tâches.</li>
          </ol>
          <p className="text-xs text-amber-200/80 bg-amber-500/10 ring-1 ring-amber-400/30 rounded-xl px-3 py-2">
            Installateur Windows (.exe) : en cours de préparation. En attendant, l&apos;installation via Chrome/Edge est équivalente.
          </p>
        </section>

        <section className="text-blue-200 bg-blue-500/10 ring-1 ring-blue-400/30 rounded-2xl p-4 text-sm space-y-2">
          <p className="font-bold text-blue-100">Connexion internet</p>
          <p className="text-blue-100/90">
            L&apos;application installée se connecte au serveur SPANC en ligne pour l&apos;IA et les emails.
            En mode <strong>hors ligne</strong>, vous pouvez saisir les contrôles, générer un PDF provisoire et synchroniser au retour du réseau
            (menu <Link href="/sync" className="underline">Synchronisation</Link>).
          </p>
        </section>
      </div>
    </main>
  )
}
