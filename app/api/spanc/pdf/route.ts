import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { RapportSPANCDocument } from "@/components/RapportSPANCPDF"
import type { RapportSPANC } from "@/lib/types/spanc"

// Force le runtime Node (react-pdf nécessite des APIs Node)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody {
  rapport: RapportSPANC
  photos?: { url: string; legende?: string }[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody
    if (!body.rapport) {
      return NextResponse.json({ error: 'Rapport manquant.' }, { status: 400 })
    }

    const buffer = await renderToBuffer(
      React.createElement(RapportSPANCDocument, { rapport: body.rapport, photos: body.photos || [] }) as any
    )

    const filename = `rapport-${body.rapport.numeroRapport || 'spanc'}.pdf`
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur génération PDF : ${String(e?.message || e)}` }, { status: 500 })
  }
}
