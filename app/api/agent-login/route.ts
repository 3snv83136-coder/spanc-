import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * AGENT_CODES env var format: "Nom:CODE,Autre:AUTRECODE"
 * ex: AGENT_CODES=Mondor:1234,Pierre:5678,Marie:9012
 */
function parseAgents(): Array<{ name: string; code: string }> {
  const raw = process.env.AGENT_CODES || ''
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      const idx = entry.indexOf(':')
      if (idx <= 0) return null
      return { name: entry.slice(0, idx).trim(), code: entry.slice(idx + 1).trim() }
    })
    .filter((x): x is { name: string; code: string } => !!x && !!x.name && !!x.code)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const code = (body?.code || '').toString().trim()
    if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 })

    const agents = parseAgents()
    if (agents.length === 0) {
      return NextResponse.json(
        { error: 'AGENT_CODES non configuré côté serveur.' },
        { status: 501 },
      )
    }

    const match = agents.find(a => a.code === code)
    if (!match) return NextResponse.json({ error: 'Code invalide' }, { status: 401 })

    return NextResponse.json({ ok: true, name: match.name })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}
