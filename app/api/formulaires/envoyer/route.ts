import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { FORMULAIRE_META, type FormulaireSPANC } from '@/lib/formulaires/types'
import { signFormulaireToken } from '@/lib/formulaires/token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICE_NAME = process.env.NEXT_PUBLIC_SPANC_SERVICE || "Service Public d'Assainissement Non Collectif"
const COLLECTIVITE = process.env.NEXT_PUBLIC_SPANC_NOM || "Communauté d'Agglomération du Grand Sénonais"
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const SPANC_EMAIL = process.env.SPANC_REPLY_EMAIL || 'spanc@grand-senonais.fr'

interface Body {
  formulaire: FormulaireSPANC
  to: string
  messageAgent?: string
}

const fmtDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d
}

function appOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_APP_URL || 'https://spanc-sens.vercel.app'
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
    const payload = {
      ...formulaire,
      messageAgent: body.messageAgent?.trim() || formulaire.messageAgent,
      coordonnees: { ...formulaire.coordonnees, email: to },
    }

    const token = signFormulaireToken({
      formId: formulaire.id,
      clientEmail: to,
      messageAgent: payload.messageAgent,
      formulaire: payload,
    })

    const origin = appOrigin(req)
    const fillUrl = `${origin}/formulaires/r/${encodeURIComponent(token)}`
    const c = payload.coordonnees
    const nomComplet = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Madame, Monsieur'
    const dateFR = fmtDate(formulaire.date)

    const resend = new Resend(apiKey)
    const recipient = process.env.RESEND_TEST_EMAIL || to
    const subject = `${meta.short} SPANC — à compléter en ligne — ${dateFR}`

    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#1a1f2e;font-size:15px;line-height:1.65;max-width:560px;">
        <div style="background:linear-gradient(135deg,#007B7F,#1A3351);color:#fff;padding:24px 28px;border-radius:16px 16px 0 0;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">SPANC Grand Sénonais</div>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;">${meta.title}</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px 28px;border-radius:0 0 16px 16px;background:#fff;">
          <p>Bonjour <strong>${nomComplet}</strong>,</p>
          <p>Le SPANC vous invite à <strong>compléter votre formulaire en ligne</strong> concernant votre installation d'assainissement non collectif.</p>
          <div style="background:#e6f7f7;border:1px solid #007B7F;border-radius:12px;padding:16px;margin:20px 0;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;">Référence</div>
            <div style="font-weight:700;color:#1A3351;font-size:16px;">${formulaire.numero}</div>
          </div>
          ${payload.messageAgent ? `<p style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;border-radius:0 8px 8px 0;"><strong>Message du SPANC :</strong><br/>${payload.messageAgent.replace(/\n/g, '<br/>')}</p>` : ''}
          <p style="text-align:center;margin:28px 0;">
            <a href="${fillUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#fbbf24);color:#0a1a3d;font-weight:800;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:16px;">
              ✏️ Remplir mon formulaire
            </a>
          </p>
          <p style="font-size:13px;color:#64748b;text-align:center;">Ce lien est personnel et valable 90 jours.</p>
          <h2 style="font-size:16px;color:#1A3351;margin:24px 0 12px;">Comment ça marche ?</h2>
          <ol style="padding-left:20px;margin:0;">
            <li style="margin-bottom:8px;">Cliquez sur le bouton ci-dessus pour ouvrir le formulaire.</li>
            <li style="margin-bottom:8px;">Remplissez les champs demandés (vos informations sont sauvegardées automatiquement).</li>
            <li style="margin-bottom:8px;">Signez électroniquement et validez — le SPANC recevra votre dossier automatiquement.</li>
          </ol>
          <p style="margin-top:20px;font-size:13px;color:#64748b;">Lien direct : <a href="${fillUrl}" style="color:#007B7F;word-break:break-all;">${fillUrl}</a></p>
          <p style="margin-top:24px;">Cordialement,<br/><strong>${SERVICE_NAME}</strong><br/>${COLLECTIVITE}<br/>${SPANC_EMAIL} · 03 86 83 12 88</p>
        </div>
      </div>
    `

    const text = `${meta.title}\n\nBonjour ${nomComplet},\n\nComplétez votre formulaire en ligne :\n${fillUrl}\n\nRéférence : ${formulaire.numero}\n\n${SERVICE_NAME} — ${COLLECTIVITE}`

    const result = await resend.emails.send({
      from: FROM,
      to: [recipient],
      replyTo: SPANC_EMAIL,
      subject,
      html,
      text,
    } as Parameters<typeof resend.emails.send>[0])

    return NextResponse.json({
      ok: true,
      id: (result as { data?: { id?: string } })?.data?.id || null,
      sentTo: recipient,
      testMode: Boolean(process.env.RESEND_TEST_EMAIL),
      fillUrl,
      token,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erreur envoi : ${msg}` }, { status: 500 })
  }
}
