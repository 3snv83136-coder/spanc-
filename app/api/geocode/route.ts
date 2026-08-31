import { NextRequest, NextResponse } from 'next/server'

// Géocodage via la Base Adresse Nationale (data.gouv.fr)
const BAN_API = 'https://api-adresse.data.gouv.fr/search/'

export async function GET(req: NextRequest) {
  const q = (new URL(req.url).searchParams.get('q') || '').trim()
  if (q.length < 5) {
    return NextResponse.json({ error: 'Adresse trop courte (min 5 caractères)' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({ q, limit: '1' })
    const r = await fetch(`${BAN_API}?${params}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!r.ok) throw new Error(`BAN ${r.status}`)
    const j = await r.json() as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] }
        properties?: { label?: string; citycode?: string; postcode?: string; city?: string }
      }>
    }
    const feat = j.features?.[0]
    if (!feat?.geometry?.coordinates) {
      return NextResponse.json({ result: null })
    }
    const [lng, lat] = feat.geometry.coordinates
    return NextResponse.json({
      result: {
        lat,
        lng,
        label: feat.properties?.label || q,
        insee: feat.properties?.citycode || null,
        codePostal: feat.properties?.postcode || null,
        commune: feat.properties?.city || null,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'erreur géocodage'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
