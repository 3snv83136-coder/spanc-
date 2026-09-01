import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { FormulaireSPANCDocument, formulaireFilename } from '@/components/formulaires/FormulairePDF'
import { FORMULAIRE_META, type FormulaireSPANC } from '@/lib/formulaires/types'
import { verifyFormulaireToken } from '@/lib/formulaires/token'
import { validateClientForm } from '@/lib/formulaires/sections'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICE_NAME = process.env.NEXT_PUBLIC_SPANC_SERVICE || "Service Public d'Assainissement Non Collectif"
const COLLECTIVITE = process.env.NEXT_PUBLIC_SPANC_NOM || "Communauté d'Agglomération du Grand Sénonais"
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const SPANC_EMAIL = process.env.SPANC_REPLY_EMAIL || 'spanc@grand-senonais.fr'

interface Body {
  token: string
  formulaire: FormulaireSPANC
}

const fmtDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const { token, formulaire } = body

    if (!token || !formulaire?.type) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const payload = verifyFormulaireToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Lien expiré ou invalide.' }, { status: 410 })
    }
    if (payload.formulaire.type !== formulaire.type || payload.formId !== formulaire.id) {
      return NextResponse.json({ error: 'Formulaire non reconnu.' }, { status: 400 })
    }

    const missing = validateClientForm(formulaire.type, formulaire as unknown as Record<string, unknown>)
    if (missing.length) {
      return NextResponse.json({
        error: `Champs obligatoires manquants : ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`,
      }, { status: 400 })
    }

    if (!formulaire.signatureClient) {
      return NextResponse.json({ error: 'Signature requise.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY non configurée.' }, { status: 500 })
    }

    const meta = FORMULAIRE_META[formulaire.type]
    const c = formulaire.coordonnees
    const nomComplet = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Usager'
    const adresse = [c.adresse, `${c.codePostal} ${c.commune}`.trim()].filter(Boolean).join(', ')
    const filename = formulaireFilename(formulaire.type, formulaire.numero)
    const dateFR = fmtDate(formulaire.date)
    const clientEmail = c.email || payload.clientEmail

    const pdfBuffer = await renderToBuffer(
      React.createElement(FormulaireSPANCDocument, { formulaire }) as React.ReactElement,
    )

    const resend = new Resend(apiKey)
    const spancRecipient = process.env.RESEND_TEST_EMAIL || SPANC_EMAIL
    const clientRecipient = process.env.RESEND_TEST_EMAIL || clientEmail

    const spancSubject = `📥 Retour formulaire ${meta.short} — ${nomComplet} — ${formulaire.numero}`

    const spancHtml = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#1a1f2e;font-size:15px;line-height:1.65;max-width:560px;">
        <div style="background:#1A3351;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:18px;">Formulaire client retourné</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;background:#fff;border-radius:0 0 12px 12px;">
          <p><strong>${meta.title}</strong> complété et signé par l'usager.</p>
          <ul style="padding-left:18px;">
            <li><strong>Usager :</strong> ${nomComplet}</li>
            <li><strong>E-mail :</strong> ${clientEmail}</li>
            <li><strong>Adresse :</strong> ${adresse || '—'}</li>
            <li><strong>Référence :</strong> ${formulaire.numero}</li>
            <li><strong>Date :</strong> ${dateFR}</li>
            ${formulaire.technicien ? `<li><strong>Technicien :</strong> ${formulaire.technicien}</li>` : ''}
          </ul>
          <p>Le PDF signé est joint à cet e-mail.</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: FROM,
      to: [spancRecipient],
      replyTo: clientEmail,
      subject: spancSubject,
      html: spancHtml,
      text: `Formulaire retourné : ${meta.title}\n${nomComplet} — ${formulaire.numero}\n${adresse}`,
      attachments: [{ filename, content: pdfBuffer.toString('base64') }],
    } as Parameters<typeof resend.emails.send>[0])

    await resend.emails.send({
      from: FROM,
      to: [clientRecipient],
      replyTo: SPANC_EMAIL,
      subject: `Confirmation — ${meta.short} SPANC reçu`,
      html: `
        <p>Bonjour <strong>${nomComplet}</strong>,</p>
        <p>Nous avons bien reçu votre formulaire <strong>${meta.title}</strong> (réf. ${formulaire.numero}).</p>
        <p>Le SPANC traitera votre dossier dans les meilleurs délais.</p>
        <p>Cordialement,<br/><strong>${SERVICE_NAME}</strong><br/>${COLLECTIVITE}</p>
      `,
      text: `Votre formulaire ${formulaire.numero} a bien été reçu par le SPANC.`,
      attachments: [{ filename, content: pdfBuffer.toString('base64') }],
    } as Parameters<typeof resend.emails.send>[0])

    return NextResponse.json({
      ok: true,
      numero: formulaire.numero,
      testMode: Boolean(process.env.RESEND_TEST_EMAIL),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erreur envoi : ${msg}` }, { status: 500 })
  }
}
