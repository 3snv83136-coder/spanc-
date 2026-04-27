// 28 communes de la Communauté d'Agglomération du Grand Sénonais (Yonne — 89)
export interface CommuneSens { nom: string; cp: string }

export const COMMUNES_SENS: CommuneSens[] = [
  { nom: 'Sens', cp: '89100' },
  { nom: 'Saint-Clément', cp: '89100' },
  { nom: 'Paron', cp: '89100' },
  { nom: 'Saint-Denis-lès-Sens', cp: '89100' },
  { nom: 'Maillot', cp: '89100' },
  { nom: 'Malay-le-Grand', cp: '89100' },
  { nom: 'Gron', cp: '89100' },
  { nom: 'Saligny', cp: '89100' },
  { nom: 'Soucy', cp: '89100' },
  { nom: 'Étigny', cp: '89510' },
  { nom: 'Véron', cp: '89510' },
  { nom: 'Marsangy', cp: '89500' },
  { nom: 'Nailly', cp: '89100' },
  { nom: 'Cuy', cp: '89140' },
  { nom: 'Passy', cp: '89510' },
  { nom: 'Rosoy', cp: '89100' },
  { nom: 'Courtois-sur-Yonne', cp: '89100' },
  { nom: 'Saint-Martin-du-Tertre', cp: '89100' },
  { nom: 'Fontaine-la-Gaillarde', cp: '89100' },
  { nom: 'Subligny', cp: '89100' },
  { nom: 'Villeperrot', cp: '89140' },
  { nom: 'Saint-Martin-sur-Oreuse', cp: '89260' },
  { nom: 'Évry', cp: '89140' },
  { nom: 'Vaumort', cp: '89320' },
  { nom: 'Thorigny-sur-Oreuse', cp: '89260' },
  { nom: 'Voisines', cp: '89260' },
  { nom: 'Les Sièges', cp: '89190' },
  { nom: 'Villiers-Louis', cp: '89190' },
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
