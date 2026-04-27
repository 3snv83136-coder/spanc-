import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5"

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 5): Promise<T> {
  let lastErr: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      const status = e?.status || e?.response?.status
      const msg = String(e?.message || '')
      const retryable =
        status === 529 || status === 503 || status === 500 || status === 429 ||
        /529|overloaded|503|500|429|rate.?limit/i.test(msg)
      if (!retryable || attempt === maxAttempts) throw e
      const delay = Math.min(1500 * Math.pow(2, attempt - 1), 10000) + Math.random() * 800
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

function parseJson(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  try { return JSON.parse(cleaned) } catch {}
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
  if (lastBrace > 0) {
    for (let i = lastBrace; i > 0; i--) {
      const attempt = cleaned.slice(0, i + 1)
      try { return JSON.parse(attempt) } catch {}
    }
  }
  throw new Error('JSON invalide')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    transcription,
    variante,       // 'tout-a-legout' | 'fosse-septique' | 'non-conforme'
    nom, prenom, adresse, code_postal, ville,
    date,
    technicien_nom,
  } = body || {}

  if (!transcription || typeof transcription !== 'string' || transcription.trim().length < 15) {
    return NextResponse.json({ error: 'Dictée trop courte — décris l\'inspection, les constats et les conclusions.' }, { status: 400 })
  }
  const VARIANTES_VALIDES = [
    'tout-a-legout',
    'fosse-septique',
    'conforme-recommandations',
    'non-conforme',
    'risque-sanitaire',
    'diagnostic-vente',
  ] as const
  if (!VARIANTES_VALIDES.includes(variante)) {
    return NextResponse.json({ error: `Variante invalide (attendu: ${VARIANTES_VALIDES.join(' | ')}).` }, { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500 })
  }

  const today = new Date()
  const dateFinal = date || today.toISOString().slice(0, 10)
  const seq = String(today.getHours()).padStart(2, '0') + String(today.getMinutes()).padStart(2, '0')
  const numero = `ATT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${seq}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const varianteLibelle =
    variante === 'tout-a-legout' ? 'Raccordement au tout-à-l\'égout (réseau public d\'assainissement collectif)' :
    variante === 'fosse-septique' ? 'Conformité du dispositif d\'assainissement non collectif (ANC)' :
    variante === 'conforme-recommandations' ? 'Conformité ANC avec recommandations d\'amélioration' :
    variante === 'risque-sanitaire' ? 'Non-conformité ANC — risque sanitaire (mise en conformité urgente)' :
    variante === 'diagnostic-vente' ? 'Diagnostic ANC dans le cadre d\'une transaction immobilière (validité 3 ans)' :
    'Non-conformité de l\'installation — travaux prescrits'

  // ============ Cadre normatif applicable selon la variante ============
  const refsCommunes = [
    "Code de la santé publique, art. L.1331-1 à L.1331-10 (raccordement aux réseaux publics de collecte)",
    "Loi n° 2006-1772 du 30 décembre 2006 sur l'eau et les milieux aquatiques (LEMA)",
    "Code de la construction et de l'habitation, art. L.271-4 (dossier de diagnostic technique en cas de vente)",
  ]
  const refsANC = [
    "NF DTU 64.1 P1-1 (mars 2013) — Mise en œuvre des dispositifs d'assainissement non collectif (maisons d'habitation individuelle ≤ 10 pièces principales)",
    "NF DTU 64.1 P1-2 (mars 2013) — Critères généraux de choix des matériaux",
    "Arrêté du 7 septembre 2009 modifié (par arrêté du 7 mars 2012) — Prescriptions techniques applicables aux installations ANC ≤ 20 EH",
    "Arrêté du 27 avril 2012 — Modalités d'exécution de la mission de contrôle des installations d'assainissement non collectif",
    "Norme NF EN 12566 — Petites stations d'épuration jusqu'à 50 EH (dispositifs préfabriqués)",
  ]
  const refsCollectif = [
    "Règlement de service du gestionnaire local d'assainissement collectif",
    "Article L.1331-4 du Code de la santé publique (responsabilité du raccordement de la partie privative jusqu'au domaine public)",
  ]

  const referencesNormatives =
    variante === 'fosse-septique' || variante === 'conforme-recommandations' ? [...refsANC, ...refsCommunes] :
    variante === 'tout-a-legout' ? [...refsCollectif, ...refsCommunes] :
    variante === 'diagnostic-vente' ? [...refsANC, ...refsCommunes] :
    [...refsANC, ...refsCollectif, ...refsCommunes]

  // ============ Méthodologie d'inspection (DTU + arrêté 27 avril 2012) ============
  const methodologieReference = `
MÉTHODOLOGIE STANDARD D'INSPECTION (référence : arrêté du 27 avril 2012, annexe I + DTU 64.1) :
1. Examen documentaire préalable : factures de vidange, plans de récolement, attestations antérieures, rapport SPANC précédent si existant.
2. Repérage des ouvrages : ventilation (évent + extracteur statique), regards de visite, tampons d'accès, dispositif de prétraitement, dispositif de traitement, exutoire.
3. Inspection visuelle (et/ou caméra endoscopique) des regards accessibles, du réseau de collecte intérieur et des sorties.
4. Relevé des matières et diamètres des collecteurs (PVC NF, fonte, grès, béton — Ø 100 mm typique pour eaux usées, Ø 150 mm en charge).
5. Contrôle de pente du gravitaire (2 à 4 % réglementaire pour Ø 100, conforme NF DTU 60.11).
6. Vérification des distances réglementaires (DTU 64.1 § 5) : ≥ 5 m de l'habitation, ≥ 3 m des limites de propriété, ≥ 3 m des arbres, ≥ 35 m de tout puits ou captage d'eau destiné à la consommation humaine.
7. Contrôle du dimensionnement : EH (équivalents-habitants) cohérent avec le nombre de pièces principales (1 PP = 1 EH, mini 5 EH).
8. État du préfiltre (colmatage des pouzzolanes), niveau de boues dans la fosse (vidange réglementaire dès 50 % du volume utile — arrêté 7 septembre 2009 art. 15).
9. Vérification de la ventilation primaire et secondaire (extraction des gaz de fermentation).
10. Identification du dispositif de traitement : tranchées d'épandage, lit filtrant drainé/non drainé, filtre à sable vertical, tertre d'infiltration, micro-station agréée (liste ministérielle), filtre planté de roseaux.
11. Examen de l'exutoire : infiltration dans le sol naturel, rejet superficiel autorisé, puits d'infiltration (sous conditions strictes).
12. Recherche d'indices de dysfonctionnement : odeurs, débordements, traces d'eaux usées en surface, végétation luxuriante anormale, écoulement permanent à l'exutoire.

CRITÈRES DE NON-CONFORMITÉ (annexe II arrêté 27 avril 2012) :
- Absence d'installation = défaut majeur, risque sanitaire.
- Installation incomplète, significativement sous-dimensionnée ou présentant des dysfonctionnements majeurs = non-conforme.
- Installation présentant un danger pour la santé des personnes ou un risque environnemental avéré (zone à enjeu sanitaire ou environnemental) = travaux obligatoires sous 4 ans, ou 1 an en cas de vente immobilière (art. L.271-4 CCH).
`

  const prompt = `Tu es un rédacteur technique d'attestations d'inspection pour une société d'assainissement française (SPANC). À partir d'une dictée vocale du technicien, tu produis le contenu rédactionnel d'une attestation de conformité destinée à être jointe à un dossier notarial (vente immobilière).

Type d'attestation choisi manuellement : ${varianteLibelle}

Propriétaire : ${prenom || ''} ${nom || ''}
Adresse du bien : ${adresse || ''}, ${code_postal || ''} ${ville || ''}
Date de l'inspection : ${dateFinal}
Technicien intervenant : ${technicien_nom || '(non précisé)'}

Dictée technicien :
"""
${transcription}
"""

📚 CADRE TECHNIQUE & RÉGLEMENTAIRE QUE TU DOIS UTILISER (référence pour la rédaction)
Textes applicables à cette attestation :
${referencesNormatives.map(r => `  • ${r}`).join('\n')}

${methodologieReference}

⛔ RÈGLES DE FIDÉLITÉ — ABSOLUES (c'est un document officiel pour un notaire)
- N'invente AUCUN fait, matériel, mesure, état, diamètre, profondeur, longueur que le technicien n'a pas dictés.
- Reformule professionnellement, mais ne rajoute rien qui ne soit pas EXPRESSÉMENT dans la dictée.
- Tu PEUX en revanche, dans les champs "methode" et "cadre_reglementaire", citer les textes normatifs et la méthodologie standard ci-dessus — ils décrivent le PROTOCOLE général, pas les constats spécifiques à ce bien.
- Si un champ de constat ne peut pas être rempli → chaîne vide "" ou tableau vide [].
- Ne qualifie JAMAIS un élément de "conforme" s'il n'est pas affirmé par le technicien.
- Le ton est sobre, technique, factuel, juridiquement précis. Pas de formule commerciale.

📋 STRUCTURATION
Produis un JSON avec :
- "objet" : paragraphe court (2-3 phrases) qui décrit la mission confiée au technicien et son cadre légal (ex: "Inspection technique du dispositif d'évacuation des eaux usées du bien, dans le cadre de la mise en vente immobilière prévue à l'article L.271-4 du Code de la construction et de l'habitation et de l'arrêté du 27 avril 2012..."). Factuel, citations sobres.
- "methode" : paragraphe (5-8 phrases) sur la méthodologie effectivement appliquée. Mentionne :
  • le cadre normatif (DTU 64.1 / arrêté 27 avril 2012 selon variante)
  • les moyens dictés par le technicien (caméra endoscopique, passage coloré, ouverture de regard, mètre laser, etc.)
  • les ouvrages effectivement inspectés (regards, prétraitement, traitement, exutoire)
  Si la dictée ne cite pas un moyen, ne l'invente pas — mais tu peux mentionner les phases standard (examen documentaire, inspection visuelle des regards accessibles).
- "cadre_reglementaire" : paragraphe (3-4 phrases) qui rappelle SPÉCIFIQUEMENT les textes applicables à CETTE variante (parmi ceux fournis ci-dessus), ainsi que la portée juridique de l'attestation (vente immobilière, délais légaux de mise en conformité). NE PAS recopier la liste — la résumer en prose juridique.
- "references_normatives" : tableau des références techniques et réglementaires effectivement applicables à cette inspection (sélectionne 4 à 7 entrées de la liste ci-dessus, dans l'ordre de pertinence). Chaque entrée = une chaîne complète avec n° + titre + date.
- "observations" : tableau de 5 à 10 lignes de relevés techniques strictement factuels (uniquement ce qui est dans la dictée), chaque ligne au format { "label": string, "valeur": string, "statut": "ok" | "ko" | "info" }. Privilégie des labels normalisés DTU 64.1 quand pertinent : "Diamètre collecteur principal", "Matière du collecteur", "Pente relevée", "Distance à l'habitation", "Distance limite de propriété", "Ventilation primaire", "Préfiltre", "Niveau de boues fosse", "État de l'exutoire", "Volume utile fosse", "Nombre d'EH desservis", etc.
  • "ok" uniquement pour ce que le technicien confirme explicitement comme bon/conforme
  • "ko" pour un constat d'anomalie explicite
  • "info" par défaut pour les relevés neutres (diamètre, matière, présence)
- "conclusion" : paragraphe (4-6 phrases) qui synthétise ce que le technicien a constaté, en lien avec les critères de l'arrêté du 27 avril 2012. Sans formuler l'attestation légale elle-même (c'est le cadre du PDF).
- "reserves" : si le technicien formule une réserve/limite (accès impossible à tel endroit, inspection partielle, ouvrage non visitable), la reprendre en 1-2 phrases. Sinon chaîne vide.

${variante === 'fosse-septique' ? `
🔶 VARIANTE "FOSSE SEPTIQUE" — champs supplémentaires (réf. DTU 64.1 + arrêté 7 sept 2009)
Ajoute aussi "fosse" = { "volume_m3": "xxx m³", "etat": "...", "acces": "...", "derniere_vidange": "..." }
- Volume : volume utile (mini 3 m³ pour ≤ 5 PP, +1 m³ par PP suppl.).
- État : structure (béton, PEHD), étanchéité, niveau de boues (vidange si > 50% du volume utile, art. 15 arrêté 7 sept 2009).
- Accès : tampon de visite affleurant, dégagé, rehaussé conformément au DTU.
- Dernière vidange : date dictée par le technicien ou "Non communiquée".
` : ''}

${(variante === 'non-conforme' || variante === 'risque-sanitaire') ? `
🔴 VARIANTE "${variante === 'risque-sanitaire' ? 'RISQUE SANITAIRE' : 'NON-CONFORME'}" — champs supplémentaires (réf. annexe II arrêté 27 avril 2012)
Ajoute :
- "anomalies" : tableau de 3 à 6 phrases qui listent PRÉCISÉMENT les non-conformités constatées au regard de l'arrêté du 27 avril 2012 (ex: "Absence de ventilation primaire — défaut au sens de la grille d'évaluation annexe II", "Distance à l'habitation < 5 m — non conforme DTU 64.1 § 5"). Basé uniquement sur la dictée.
- "recommandations" : tableau de 3 à 5 actions correctives à envisager, SANS les chiffrer (c'est une attestation, pas un devis). Mentionne les délais légaux applicables (${variante === 'risque-sanitaire' ? '1 an — risque sanitaire avéré, ou avant la signature de l\'acte authentique en cas de vente' : '4 ans ordinaire, 1 an si vente'}).
` : ''}

${(variante === 'conforme-recommandations' || variante === 'diagnostic-vente') ? `
🟡 VARIANTE "${variante === 'diagnostic-vente' ? 'DIAGNOSTIC DE VENTE' : 'CONFORME AVEC RECOMMANDATIONS'}"
Ajoute :
- "recommandations" : tableau de 2 à 5 recommandations d'amélioration ou d'entretien (vidange à programmer, curage du préfiltre, surveillance d'un point particulier). Sobre, technique. Pas de prestation chiffrée.
${variante === 'diagnostic-vente' ? '- Le présent diagnostic est valable 3 ans à compter de la date d\'inspection. Si non-conformité : mise en conformité par l\'acquéreur dans l\'année suivant la signature (article L.271-4 CCH).' : ''}
` : ''}

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :
{
  "objet": "...",
  "methode": "...",
  "cadre_reglementaire": "...",
  "references_normatives": ["..."],
  "observations": [
    { "label": "Ex: Diamètre du collecteur principal", "valeur": "Ex: PVC Ø100 mm", "statut": "info" }
  ],
  "conclusion": "...",
  "reserves": ""${variante === 'fosse-septique' ? `,
  "fosse": { "volume_m3": "", "etat": "", "acces": "", "derniere_vidange": "" }` : ''}${variante === 'non-conforme' ? `,
  "anomalies": ["..."],
  "recommandations": ["..."]` : ''}
}`

  let msg
  try {
    msg = await callWithRetry(() => client.messages.create({
      model: MODEL,
      max_tokens: 5000,
      messages: [{ role: "user", content: prompt }],
    }))
  } catch (e: any) {
    return NextResponse.json({ error: `Anthropic API : ${e?.message || e?.toString()}` }, { status: 500 })
  }

  let data: any
  try {
    data = parseJson((msg.content[0] as { type: string; text: string }).text)
  } catch (e: any) {
    return NextResponse.json({
      error: `Réponse IA illisible : ${e.message}`,
      raw: (msg.content[0] as any)?.text?.slice(0, 500),
    }, { status: 500 })
  }

  // Normalisation
  if (!Array.isArray(data.observations)) data.observations = []
  data.observations = data.observations.map((o: any) => ({
    label: typeof o?.label === 'string' ? o.label : '',
    valeur: typeof o?.valeur === 'string' ? o.valeur : '',
    statut: ['ok', 'ko', 'info'].includes(o?.statut) ? o.statut : 'info',
  })).filter((o: any) => o.label)

  if (!Array.isArray(data.references_normatives)) data.references_normatives = []
  data.references_normatives = data.references_normatives
    .filter((s: any) => typeof s === 'string' && s.trim().length > 5)
    .slice(0, 8)

  // Si l'IA n'a pas produit la liste, on injecte le fallback maison
  if (data.references_normatives.length === 0) {
    data.references_normatives = referencesNormatives.slice(0, 6)
  }

  if (variante === 'non-conforme' || variante === 'risque-sanitaire') {
    if (!Array.isArray(data.anomalies)) data.anomalies = []
    if (!Array.isArray(data.recommandations)) data.recommandations = []
  }
  if (variante === 'conforme-recommandations' || variante === 'diagnostic-vente') {
    if (!Array.isArray(data.recommandations)) data.recommandations = []
  }

  const includeAnomalies = variante === 'non-conforme' || variante === 'risque-sanitaire'
  const includeRecommandations = includeAnomalies || variante === 'conforme-recommandations' || variante === 'diagnostic-vente'

  return NextResponse.json({
    numero,
    date: dateFinal,
    variante,
    nom: nom || '',
    prenom: prenom || '',
    adresse: adresse || '',
    codePostal: code_postal || '',
    ville: ville || '',
    technicienNom: technicien_nom || '',
    objet: typeof data.objet === 'string' ? data.objet : '',
    methode: typeof data.methode === 'string' ? data.methode : '',
    cadreReglementaire: typeof data.cadre_reglementaire === 'string' ? data.cadre_reglementaire : '',
    referencesNormatives: data.references_normatives,
    observations: data.observations,
    conclusion: typeof data.conclusion === 'string' ? data.conclusion : '',
    reserves: typeof data.reserves === 'string' ? data.reserves : '',
    ...(variante === 'fosse-septique' ? { fosse: data.fosse || {} } : {}),
    ...(includeAnomalies ? { anomalies: data.anomalies } : {}),
    ...(includeRecommandations ? { recommandations: data.recommandations } : {}),
  })
}
