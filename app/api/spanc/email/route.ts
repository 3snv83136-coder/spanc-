import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { RapportSPANCDocument } from "@/components/RapportSPANCPDF"
import { AVIS_LABELS, type RapportSPANC } from "@/lib/types/spanc"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody {
  rapport: RapportSPANC
  photos?: { url: string; legende?: string }[]
  to?: string
  cc?: string[]
}

const SERVICE_NAME = process.env.NEXT_PUBLIC_SPANC_SERVICE || "Service Public d'Assainissement Non Collectif"
const COLLECTIVITE = process.env.NEXT_PUBLIC_SPANC_NOM || "Communauté d'Agglomération du Grand Sénonais"
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody
    const rapport = body.rapport
    if (!rapport) return NextResponse.json({ error: 'Rapport manquant.' }, { status: 400 })

    const to = body.to || rapport.usager?.email
    if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
      return NextResponse.json({ error: 'Destinataire (email) invalide.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY non configurée.' }, { status: 500 })
    }

    const resend = new Resend(apiKey)

    const pdfBuffer = await renderToBuffer(
      React.createElement(RapportSPANCDocument, { rapport, photos: body.photos || [] }) as any
    )

    const av = AVIS_LABELS[rapport.avisConformite]
    const u = rapport.usager
    const adresse = [u.adresse, `${u.codePostal || ''} ${u.commune || ''}`].filter(Boolean).join(', ')
    const dateFR = rapport.dateControle?.split('-').reverse().join('/') || ''
    const filename = `rapport-${rapport.numeroRapport}.pdf`

    const subject = `Rapport de contrôle SPANC — ${u.commune || ''} — ${dateFR}`.trim()

    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#1a1f2e;font-size:14px;line-height:1.6;max-width:600px;">
        <h2 style="color:#0e2a52;margin:0 0 12px;">Rapport de contrôle SPANC</h2>
        <p>Bonjour ${[u.prenom, u.nom].filter(Boolean).join(' ') || ''},</p>
        <p>Veuillez trouver en pièce jointe le rapport de contrôle de votre installation d'assainissement non collectif réalisé le <strong>${dateFR}</strong> au <strong>${adresse}</strong>.</p>
        <div style="border:1px solid #c7cfdb;border-radius:8px;padding:14px;margin:16px 0;background:#eef2f8;">
          <div style="font-size:11px;color:#5a6270;text-transform:uppercase;letter-spacing:0.4px;">Numéro de rapport</div>
          <div style="font-weight:bold;color:#0e2a52;font-size:15px;">${rapport.numeroRapport}</div>
          <div style="margin-top:10px;font-size:11px;color:#5a6270;text-transform:uppercase;letter-spacing:0.4px;">Avis de conformité</div>
          <div style="font-weight:bold;color:#0e2a52;font-size:15px;">${av.icon} ${av.label}</div>
          <div style="margin-top:10px;font-size:11px;color:#5a6270;text-transform:uppercase;letter-spacing:0.4px;">Prochain contrôle</div>
          <div style="font-weight:bold;color:#0e2a52;font-size:15px;">dans ${rapport.prochaineEcheance}</div>
        </div>
        <p>Pour toute question relative à ce rapport, vous pouvez contacter le ${SERVICE_NAME} de la ${COLLECTIVITE}.</p>
        <p style="font-size:11px;color:#5a6270;margin-top:20px;">Document établi conformément à l'arrêté du 27 avril 2012 relatif aux modalités d'exécution de la mission de contrôle des installations d'ANC.</p>
      </div>
    `

    const text = `Rapport de contrôle SPANC\n\nNuméro : ${rapport.numeroRapport}\nAdresse : ${adresse}\nDate : ${dateFR}\nAvis : ${av.label}\nProchain contrôle : ${rapport.prochaineEcheance}\n\n${SERVICE_NAME} — ${COLLECTIVITE}`

    const result = await resend.emails.send({
      from: FROM,
      to: [to],
      cc: body.cc,
      subject,
      html,
      text,
      attachments: [
        {
          filename,
          content: pdfBuffer.toString('base64'),
        },
      ],
    } as any)

    return NextResponse.json({ ok: true, id: (result as any)?.data?.id || null })
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur envoi email : ${String(e?.message || e)}` }, { status: 500 })
  }
}
