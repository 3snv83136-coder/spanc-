import { createHmac, timingSafeEqual } from 'crypto'
import type { FormulaireSPANC } from './types'

export type FormulaireTokenPayload = {
  v: 1
  formId: string
  clientEmail: string
  messageAgent?: string
  formulaire: FormulaireSPANC
  exp: number
}

function secret(): string {
  return (
    process.env.FORMULAIRE_SECRET
    || process.env.NEXTAUTH_SECRET
    || 'spanc-formulaires-dev-secret'
  )
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, 'base64url')
}

export function signFormulaireToken(payload: Omit<FormulaireTokenPayload, 'v' | 'exp'> & { exp?: number }): string {
  const full: FormulaireTokenPayload = {
    v: 1,
    exp: payload.exp ?? Date.now() + 90 * 24 * 60 * 60 * 1000,
    formId: payload.formId,
    clientEmail: payload.clientEmail,
    messageAgent: payload.messageAgent,
    formulaire: payload.formulaire,
  }
  const data = b64url(Buffer.from(JSON.stringify(full), 'utf8'))
  const sig = createHmac('sha256', secret()).update(data).digest()
  return `${data}.${b64url(sig)}`
}

export function verifyFormulaireToken(token: string): FormulaireTokenPayload | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = createHmac('sha256', secret()).update(data).digest()
    const actual = fromB64url(sig)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
    const payload = JSON.parse(fromB64url(data).toString('utf8')) as FormulaireTokenPayload
    if (payload.v !== 1 || !payload.formulaire?.type) return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
