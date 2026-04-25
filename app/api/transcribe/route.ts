import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })
  }
  const formData = await req.formData()
  const audioFile = formData.get('audio') as File
  if (!audioFile) return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 })

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "fr",
      prompt: "SPANC, assainissement non collectif, fosse toutes eaux, fosse septique, préfiltre, bac dégraisseur, filtre à sable, tertre d'infiltration, étude de sol, perméabilité, exutoire, regard, ventilation, DTU 64.1, arrêté 7 mars 2012, contrôle de bon fonctionnement, diagnostic vente, vidange, réhabilitation, Var",
    })
    return NextResponse.json({ text: transcription.text })
  } catch (e: any) {
    return NextResponse.json({ error: `OpenAI : ${e.message || e.toString()}` }, { status: 500 })
  }
}
