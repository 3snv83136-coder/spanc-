export interface EquipementANC {
  id: string
  label: string
  icon: string
  category: string
  keywords: string[]
}

export const EQUIPEMENTS_ANC: EquipementANC[] = [
  { id: 'fosse_septique', label: 'Fosse septique', icon: '🛢️', category: 'Prétraitement', keywords: ['fosse', 'septique'] },
  { id: 'fosse_toutes_eaux', label: 'Fosse toutes eaux', icon: '🪣', category: 'Prétraitement', keywords: ['fosse', 'eaux'] },
  { id: 'bac_graisses', label: 'Bac à graisses', icon: '🫙', category: 'Prétraitement', keywords: ['graisses', 'bac'] },
  { id: 'micro_station', label: 'Micro-station', icon: '⚙️', category: 'Prétraitement', keywords: ['micro', 'station'] },
  { id: 'toilettes_seches', label: 'Toilettes sèches', icon: '🚻', category: 'Prétraitement', keywords: ['toilettes', 'sèches'] },
  { id: 'filtre_sable', label: 'Filtre à sable', icon: '🔲', category: 'Traitement', keywords: ['filtre', 'sable'] },
  { id: 'filtre_compact', label: 'Filtre compact', icon: '▦', category: 'Traitement', keywords: ['filtre', 'compact'] },
  { id: 'tertre_filtrant', label: 'Tertre filtrant', icon: '⛰️', category: 'Traitement', keywords: ['tertre'] },
  { id: 'phytoepuration', label: 'Phytoépuration', icon: '🌿', category: 'Traitement', keywords: ['phyto'] },
  { id: 'tranchees_epandage', label: "Tranchées d'épandage", icon: '〰️', category: 'Épandage', keywords: ['tranchée', 'épandage'] },
  { id: 'zone_absorption', label: "Zone d'absorption", icon: '💧', category: 'Épandage', keywords: ['absorption'] },
  { id: 'zone_infiltration', label: "Zone d'infiltration", icon: '🕳️', category: 'Rejet', keywords: ['infiltration'] },
  { id: 'regard', label: 'Regard', icon: '⭕', category: 'Réseau', keywords: ['regard'] },
  { id: 'ventilation', label: 'Ventilation', icon: '💨', category: 'Réseau', keywords: ['ventilation', 'aération'] },
  { id: 'ventilation_tranchee', label: 'Aération de tranchée', icon: '🌬️', category: 'Réseau', keywords: ['aération', 'tranchée'] },
  { id: 'puits', label: 'Puits', icon: '🪨', category: 'Captage', keywords: ['puits', 'captage'] },
  { id: 'arbre', label: 'Arbre', icon: '🌳', category: 'Environnement', keywords: ['arbre', 'végétation'] },
  { id: 'habitation', label: 'Habitation', icon: '🏠', category: 'Bâti', keywords: ['maison', 'habitation'] },
  { id: 'rejet_cours_eau', label: "Rejet cours d'eau", icon: '🌊', category: 'Rejet', keywords: ['cours', 'eau'] },
  { id: 'fosse_vidange', label: 'Fosse de vidange', icon: '🚛', category: 'Accès', keywords: ['vidange'] },
]

export function findEquipement(id: string): EquipementANC | undefined {
  return EQUIPEMENTS_ANC.find(e => e.id === id)
}

export function filterEquipements(query: string): EquipementANC[] {
  const q = query.trim().toLowerCase()
  if (!q) return EQUIPEMENTS_ANC
  return EQUIPEMENTS_ANC.filter(e =>
    e.label.toLowerCase().includes(q)
    || e.category.toLowerCase().includes(q)
    || e.keywords.some(k => k.includes(q)),
  )
}
