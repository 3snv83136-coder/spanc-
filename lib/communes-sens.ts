// 28 communes de la Communauté d'Agglomération du Grand Sénonais (Yonne — 89)
// Codes INSEE issus de geo.api.gouv.fr (data.gouv.fr) — utilisés pour les requêtes
// API Carto Cadastre IGN (apicarto.ign.fr/api/cadastre/parcelle).
export interface CommuneSens { nom: string; cp: string; insee: string }

export const COMMUNES_SENS: CommuneSens[] = [
  { nom: 'Sens', cp: '89100', insee: '89387' },
  { nom: 'Saint-Clément', cp: '89100', insee: '89338' },
  { nom: 'Paron', cp: '89100', insee: '89287' },
  { nom: 'Saint-Denis-lès-Sens', cp: '89100', insee: '89342' },
  { nom: 'Maillot', cp: '89100', insee: '89236' },
  { nom: 'Malay-le-Grand', cp: '89100', insee: '89239' },
  { nom: 'Gron', cp: '89100', insee: '89195' },
  { nom: 'Saligny', cp: '89100', insee: '89373' },
  { nom: 'Soucy', cp: '89100', insee: '89399' },
  { nom: 'Étigny', cp: '89510', insee: '89160' },
  { nom: 'Véron', cp: '89510', insee: '89443' },
  { nom: 'Marsangy', cp: '89500', insee: '89245' },
  { nom: 'Nailly', cp: '89100', insee: '89274' },
  { nom: 'Cuy', cp: '89140', insee: '89136' },
  { nom: 'Passy', cp: '89510', insee: '89291' },
  { nom: 'Rosoy', cp: '89100', insee: '89326' },
  { nom: 'Courtois-sur-Yonne', cp: '89100', insee: '89127' },
  { nom: 'Saint-Martin-du-Tertre', cp: '89100', insee: '89354' },
  { nom: 'Fontaine-la-Gaillarde', cp: '89100', insee: '89172' },
  { nom: 'Subligny', cp: '89100', insee: '89404' },
  { nom: 'Villeperrot', cp: '89140', insee: '89465' },
  // Saint-Martin-sur-Oreuse a fusionné en 2017 dans la commune nouvelle Perceneige (89469)
  { nom: 'Saint-Martin-sur-Oreuse', cp: '89260', insee: '89469' },
  { nom: 'Évry', cp: '89140', insee: '89162' },
  { nom: 'Vaumort', cp: '89320', insee: '89434' },
  { nom: 'Thorigny-sur-Oreuse', cp: '89260', insee: '89414' },
  { nom: 'Voisines', cp: '89260', insee: '89483' },
  { nom: 'Les Sièges', cp: '89190', insee: '89395' },
  { nom: 'Villiers-Louis', cp: '89320', insee: '89471' },
]

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function searchCommunes(query: string, limit = 8): CommuneSens[] {
  const q = normalize(query)
  if (!q) return COMMUNES_SENS.slice(0, limit)
  return COMMUNES_SENS
    .filter(c => normalize(c.nom).includes(q))
    .sort((a, b) => {
      const an = normalize(a.nom)
      const bn = normalize(b.nom)
      const aStarts = an.startsWith(q)
      const bStarts = bn.startsWith(q)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.nom.localeCompare(b.nom, 'fr')
    })
    .slice(0, limit)
}

export function findCommuneByName(name: string): CommuneSens | undefined {
  const q = normalize(name)
  return COMMUNES_SENS.find(c => normalize(c.nom) === q)
}
