import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.attestation) {
      return NextResponse.json({ error: 'attestation manquante' }, { status: 400 })
    }

    const url = process.env.GOOGLE_DRIVE_WEBHOOK_URL
    const token = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN

    if (!url) {
      return NextResponse.json(
        { error: 'GOOGLE_DRIVE_WEBHOOK_URL non configuré côté serveur. Ajoute la variable d\'env sur Vercel.' },
        { status: 501 },
      )
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        kind: 'attestation',
        numero: body.attestation.numero,
        nom: body.attestation.nom,
        prenom: body.attestation.prenom,
        adresse: body.attestation.adresse,
        ville: body.attestation.ville,
        date: body.attestation.date,
        payload: body.attestation,
      }),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `Webhook Drive a répondu ${res.status}: ${txt.slice(0, 200)}` },
        { status: 502 },
      )
    }

    const json = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: true, url: json.url || json.fileUrl || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}
