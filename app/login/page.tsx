'use client'
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      username: form.get('username') as string,
      password: form.get('password') as string,
      redirect: false,
    })
    if (result?.error) {
      setError('Identifiant ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push('/nouveau')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a1a3d] px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1a3d] via-[#0e2a52] to-[#071026]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/">
            <img src="/logo.png" alt="SPANC SENS" className="mx-auto mb-3 h-16 w-auto" />
          </Link>
          <h1 className="text-xl font-black uppercase tracking-wide text-white">SPANC — Interventions</h1>
          <p className="mt-1 text-sm text-white/60">Espace technicien</p>
        </div>
        <form onSubmit={handleSubmit} className="spanc-card space-y-4">
          <input
            name="username"
            type="text"
            placeholder="Identifiant"
            required
            className="spanc-input"
          />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
            className="spanc-input"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="spanc-btn-primary w-full">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
