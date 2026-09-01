import { NextRequest, NextResponse } from 'next/server'
import { verifyFormulaireToken } from '@/lib/formulaires/token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  }

  const payload = verifyFormulaireToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Lien expiré ou invalide.' }, { status: 410 })
  }

  return NextResponse.json({
    ok: true,
    formId: payload.formId,
    clientEmail: payload.clientEmail,
    messageAgent: payload.messageAgent,
    formulaire: payload.formulaire,
    exp: payload.exp,
  })
}
