import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { FormulaireSPANCDocument, formulaireFilename } from '@/components/formulaires/FormulairePDF'
import { FORMULAIRE_META, type FormulaireSPANC } from '@/lib/formulaires/types'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICE_NAME = process.env.NEXT_PUBLIC_SPANC_SERVICE || "Service Public d'Assainissement Non Collectif"
const COLLECTIVITE = process.env.NEXT_PUBLIC_SPANC_NOM || "Communauté d'Agglomération du Grand Sénonais"
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const SPANC_EMAIL = process.env.SPANC_REPLY_EMAIL || 'spanc@grand-senonais.fr'

interface Body {
  formulaire: FormulaireSPANC
  to: string
  cc?: string[]
}

const fmtDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const formulaire = body.formulaire
    const to = body.to?.trim()

    if (!formulaire?.type) {
      return NextResponse.json({ error: 'Formulaire manquant.' }, { status: 400 })
    }
    if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
      return NextResponse.json({ error: 'Adresse e-mail du client invalide.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY non configurée.' }, { status: 500 })
    }

    const meta = FORMULAIRE_META[formulaire.type]
    const c = formulaire.coordonnees
    const nomComplet = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Madame, Monsieur'
    const adresse = [c.adresse, `${c.codePostal} ${c.commune}`.trim()].filter(Boolean).join(', ')
    const filename = formulaireFilename(formulaire.type, formulaire.numero)
    const dateFR = fmtDate(formulaire.date)

    const pdfBuffer = await renderToBuffer(
      React.createElement(FormulaireSPANCDocument, { formulaire }) as React.ReactElement,
    )

    const attachments: { filename: string; content: string }[] = [
      { filename, content: pdfBuffer.toString('base64') },
    ]

    const modele = meta.modelePdf
    if (modele) {
      try {
        const modelPath = path.join(process.cwd(), 'public', modele.replace(/^\//, ''))
        const modelBuf = await readFile(modelPath)
        attachments.push({
          filename: 'modele-officiel-SPANC-v2025.pdf',
          content: modelBuf.toString('base64'),
        })
      } catch {
        // modèle optionnel
      }
    }

    const resend = new Resend(apiKey)
    const recipient = process.env.RESEND_TEST_EMAIL || to

    const subject = `${meta.short} SPANC — ${c.commune || 'Grand Sénonais'} — ${dateFR}`

    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#1a1f2e;font-size:15px;line-height:1.65;max-width:560px;">
        <div style="background:linear-gradient(135deg,#0e2a52,#1e4a7a);color:#fff;padding:24px 28px;border-radius:16px 16px 0 0;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">SPANC Grand Sénonais</div>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;">${meta.title}</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px 28px;border-radius:0 0 16px 16px;background:#fff;">
          <p>Bonjour <strong>${nomComplet}</strong>,</p>
          <p>Veuillez trouver ci-joint le formulaire <strong>${meta.title}</strong> concernant votre installation d'assainissement non collectif.</p>
          <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Référence</div>
            <div style="font-weight:700;color:#0e2a52;font-size:16px;">${formulaire.numero}</div>
            <div style="margin-top:10px;font-size:11px;color:#64748b;text-transform:uppercase;">Adresse</div>
            <div style="font-weight:600;color:#0e2a52;">${adresse || '—'}</div>
            <div style="margin-top:10px;font-size:11px;color:#64748b;text-transform:uppercase;">Date</div>
            <div style="font-weight:600;color:#0e2a52;">${dateFR}</div>
          </div>
          ${formulaire.messageAgent ? `<p style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;border-radius:0 8px 8px 0;"><strong>Message du SPANC :</strong><br/>${formulaire.messageAgent.replace(/\n/g, '<br/>')}</p>` : ''}
          <h2 style="font-size:16px;color:#0e2a52;margin:24px 0 12px;">📋 Comment nous renvoyer le formulaire ?</h2>
          <ol style="padding-left:20px;margin:0;">
            <li style="margin-bottom:8px;">Vérifiez les informations pré-remplies et complétez les champs manquants.</li>
            <li style="margin-bottom:8px;">Signez le formulaire en bas de page.</li>
            <li style="margin-bottom:8px;">Renvoyez-le par e-mail à <a href="mailto:${SPANC_EMAIL}" style="color:#ea580c;font-weight:700;">${SPANC_EMAIL}</a> en répondant à ce message.</li>
          </ol>
          <p style="margin-top:20px;font-size:13px;color:#64748b;">Vous pouvez aussi déposer votre dossier complet au SPANC : 18 rue de Chantecoq, Z.I. des Vauguillettes, 89100 Sens — 03 86 83 12 88.</p>
          <p style="margin-top:24px;">Cordialement,<br/><strong>${SERVICE_NAME}</strong><br/>${COLLECTIVITE}</p>
        </div>
      </div>
    `

    const text = `${meta.title}\n\nBonjour ${nomComplet},\n\nRéférence : ${formulaire.numero}\nAdresse : ${adresse}\nDate : ${dateFR}\n\nVeuillez compléter, signer et renvoyer ce formulaire à ${SPANC_EMAIL}.\n\n${SERVICE_NAME} — ${COLLECTIVITE}`

    const result = await resend.emails.send({
      from: FROM,
      to: [recipient],
      cc: body.cc,
      replyTo: SPANC_EMAIL,
      subject,
      html,
      text,
      attachments,
    } as Parameters<typeof resend.emails.send>[0])

    return NextResponse.json({
      ok: true,
      id: (result as { data?: { id?: string } })?.data?.id || null,
      sentTo: recipient,
      testMode: Boolean(process.env.RESEND_TEST_EMAIL),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erreur envoi : ${msg}` }, { status: 500 })
  }
}
