import { NextRequest, NextResponse } from "next/server"

// Proxy léger vers l'API Carto Cadastre IGN (https://apicarto.ign.fr/api/doc/cadastre)
// Données issues du Plan Cadastral Informatisé (DGFiP) — diffusées via data.gouv.fr / IGN.
//
// Usage :
//   GET /api/cadastre?insee=89387                        → { sections: ["AB","BE","BD",...] }
//   GET /api/cadastre?insee=89387&section=BE             → { numeros: ["0001","0042","0187",...] }
//   GET /api/cadastre?insee=89387&section=BE&numero=0187 → { parcelle: { idu, contenance, feuille } | null }

const IGN_BASE = "https://apicarto.ign.fr/api/cadastre/parcelle"
const PAGE_SIZE = 1000 // limite serveur IGN
const MAX_PAGES = 30   // garde-fou : 30 000 parcelles par commune max
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7 // 7 jours

interface IgnFeature {
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon
  properties?: {
    section?: string
    numero?: string
    idu?: string
    contenance?: number
    feuille?: number
  }
}

async function fetchPage(insee: string, section: string | null, start: number): Promise<IgnFeature[]> {
  const params = new URLSearchParams({ code_insee: insee, _start: String(start) })
  if (section) params.set("section", section)
  const url = `${IGN_BASE}?${params.toString()}`
  const r = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS, tags: [`cadastre:${insee}`] },
  })
  if (!r.ok) throw new Error(`IGN ${r.status}`)
  const j = await r.json() as { features?: IgnFeature[] }
  return j.features || []
}

async function fetchAll(insee: string, section: string | null): Promise<IgnFeature[]> {
  const all: IgnFeature[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const features = await fetchPage(insee, section, page * PAGE_SIZE)
    all.push(...features)
    if (features.length < PAGE_SIZE) break
  }
  return all
}

function isInseeCode(s: string): boolean {
  return /^[0-9AB][0-9]{4}$/.test(s) // 5 caractères, support Corse 2A/2B
}

function isSection(s: string): boolean {
  return /^[A-Z0-9]{1,3}$/.test(s)
}

function isNumero(s: string): boolean {
  return /^[0-9]{1,4}$/.test(s)
}

function normaliseNumero(n: string): string {
  return n.padStart(4, "0")
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const insee = (searchParams.get("insee") || "").trim().toUpperCase()
  const sectionRaw = (searchParams.get("section") || "").trim().toUpperCase()
  const numeroRaw = (searchParams.get("numero") || "").trim()

  if (!insee || !isInseeCode(insee)) {
    return NextResponse.json({ error: "insee requis (5 caractères, ex: 89387)" }, { status: 400 })
  }
  const section = sectionRaw || null
  if (section && !isSection(section)) {
    return NextResponse.json({ error: "section invalide" }, { status: 400 })
  }
  const numero = numeroRaw ? normaliseNumero(numeroRaw) : null
  if (numero && !isNumero(numeroRaw)) {
    return NextResponse.json({ error: "numero invalide" }, { status: 400 })
  }

  try {
    // Cas 1 : recherche d'une parcelle précise
    if (section && numero) {
      const params = new URLSearchParams({ code_insee: insee, section, numero })
      const r = await fetch(`${IGN_BASE}?${params.toString()}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: REVALIDATE_SECONDS, tags: [`cadastre:${insee}:${section}:${numero}`] },
      })
      if (!r.ok) throw new Error(`IGN ${r.status}`)
      const j = await r.json() as { features?: IgnFeature[] }
      const f = j.features?.[0]
      if (!f?.properties) return NextResponse.json({ parcelle: null })
      const p = f.properties
      return NextResponse.json({
        parcelle: {
          idu: p.idu,
          section: p.section,
          numero: p.numero,
          feuille: p.feuille,
          contenance: p.contenance, // m²
          geometry: f.geometry ?? null,
        },
      })
    }

    // Cas 2 : lister numéros d'une section
    if (section) {
      const features = await fetchAll(insee, section)
      const numeros = Array.from(
        new Set(features.map(f => f.properties?.numero).filter((n): n is string => !!n)),
      ).sort()
      return NextResponse.json({ numeros })
    }

    // Cas 3 : lister sections de la commune
    const features = await fetchAll(insee, null)
    const sections = Array.from(
      new Set(features.map(f => f.properties?.section).filter((s): s is string => !!s)),
    ).sort()
    return NextResponse.json({ sections })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "erreur cadastre"
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
