import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const spancUrl = process.env.SPANC_API_URL
  const token = process.env.SPANC_PUBLISH_TOKEN

  if (!spancUrl || !token) {
    return NextResponse.json({ error: 'Config SPANC manquante' }, { status: 500 })
  }

  try {
    const response = await fetch(`${spancUrl}/api/gallery/publish/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    })

    const txt = await response.text()
    let data: any = null
    try { data = JSON.parse(txt) } catch { /* réponse non-JSON (HTML d'erreur Django, etc.) */ }

    if (!response.ok) {
      console.error('[publish] SPANC API error', {
        status: response.status,
        url: `${spancUrl}/api/gallery/publish/`,
        contentType: response.headers.get('content-type'),
        bodyPreview: txt.slice(0, 2000),
        sentFields: Array.from(formData.keys()),
      })
      const msg = data
        ? (typeof data === 'string' ? data : data.error || data.detail || JSON.stringify(data))
        : `HTTP ${response.status} — ${txt.slice(0, 800)}`
      return NextResponse.json({ error: `SPANC API : ${msg}`, status: response.status, bodyPreview: txt.slice(0, 800) }, { status: response.status })
    }

    return NextResponse.json(data ?? { ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: `Publish fetch failed : ${e.message || e.toString()}` }, { status: 500 })
  }
}
