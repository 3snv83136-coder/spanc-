export function buildCartographieUrl(params: {
  adresse?: string
  codePostal?: string
  commune?: string
  section?: string
  numero?: string
  returnTo?: string
  auto?: boolean
}): string {
  const q = new URLSearchParams()
  if (params.adresse) q.set('adresse', params.adresse)
  if (params.codePostal) q.set('cp', params.codePostal)
  if (params.commune) q.set('commune', params.commune)
  if (params.section) q.set('section', params.section)
  if (params.numero) q.set('numero', params.numero)
  if (params.returnTo) q.set('return', params.returnTo)
  if (params.auto) q.set('auto', '1')
  const s = q.toString()
  return s ? `/cartographie?${s}` : '/cartographie'
}
