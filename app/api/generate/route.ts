import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5"
const SITE = 'https://votre-domaine-spanc.fr'

const SERVICES = [
  { slug: 'spanc/controle-bon-fonctionnement', label: 'Contrôle de bon fonctionnement ANC' },
  { slug: 'spanc/diagnostic-vente-immobiliere', label: 'Diagnostic ANC vente immobilière' },
  { slug: 'spanc/controle-conception', label: 'Contrôle de conception (avant travaux)' },
  { slug: 'spanc/controle-realisation', label: 'Contrôle de réalisation (après travaux)' },
  { slug: 'spanc/installation-neuve', label: 'Contrôle d\'installation neuve' },
  { slug: 'spanc/rehabilitation', label: 'Réhabilitation installation ANC' },
  { slug: 'spanc/vidange-fosse', label: 'Vidange fosse toutes eaux / septique' },
  { slug: 'tarifs', label: 'Nos tarifs SPANC' },
]

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

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
  let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  // Premier essai
  try { return JSON.parse(cleaned) } catch {}
  // Si troncature : tenter de couper au dernier objet/tableau valide
  // Extrait le plus grand préfixe qui parse
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
  if (lastBrace > 0) {
    for (let i = lastBrace; i > 0; i--) {
      const attempt = cleaned.slice(0, i + 1)
      try { return JSON.parse(attempt) } catch {}
    }
  }
  // Tentative plus agressive : fermer les chaînes ouvertes puis les objets/tableaux
  try {
    const repaired = repairJson(cleaned)
    return JSON.parse(repaired)
  } catch {}
  throw new Error('JSON invalide et irréparable')
}

function repairJson(s: string): string {
  // Ferme les guillemets non terminés en fin de chaîne
  let result = s
  // Compte la parité des guillemets non échappés
  let inString = false
  let escaped = false
  let lastOpenString = -1
  for (let i = 0; i < result.length; i++) {
    const c = result[i]
    if (escaped) { escaped = false; continue }
    if (c === '\\') { escaped = true; continue }
    if (c === '"') {
      if (inString) { inString = false } else { inString = true; lastOpenString = i }
    }
  }
  if (inString) result = result + '"'
  // Ferme les tableaux et objets ouverts
  let opens = 0, closes = 0, bOpens = 0, bCloses = 0
  inString = false; escaped = false
  for (const c of result) {
    if (escaped) { escaped = false; continue }
    if (c === '\\') { escaped = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{') opens++
    if (c === '}') closes++
    if (c === '[') bOpens++
    if (c === ']') bCloses++
  }
  while (bCloses < bOpens) { result += ']'; bCloses++ }
  while (closes < opens) { result += '}'; closes++ }
  return result
}

export async function POST(req: NextRequest) {
  const { transcription, type_intervention, ville, code_postal } = await req.json()
  if (!transcription || !type_intervention || !ville) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Pré-calculs (utilisés par les 2 prompts en parallèle)
  const villeSlug = slugify(ville)
  const cp = code_postal || '83000'
  const cityUrl = `${SITE}/${villeSlug}-${cp}`
  const typeSlug = slugify(type_intervention)
  const today = new Date()
  const dateSlug = String(today.getDate()).padStart(2, '0') + String(today.getMonth() + 1).padStart(2, '0') + today.getFullYear()
  // Numérotation séquentielle basée sur l'heure (évite collisions même jour)
  const seq = String(today.getHours()).padStart(2, '0') + String(today.getMinutes()).padStart(2, '0')
  // Slug inclut l'heure → unique même si 2 interventions/jour sur même ville/type
  const realisationSlug = `${typeSlug}-${villeSlug}-${dateSlug}-${seq}`
  const reference = `SPANC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${seq}`

  // === APPEL 1 — RAPPORT TECHNIQUE COMPLET (pour PDF détaillé) ===
  const rapportPrompt = `Tu es un rédacteur expert de rapports de contrôle SPANC / diagnostic d'assainissement non collectif (style bureau d'études, rapport réglementaire). À partir d'une dictée vocale d'un technicien SPANC ou d'un diagnostiqueur ANC, tu produis un document détaillé et exhaustif destiné au propriétaire, au notaire (en cas de vente) ou au service public d'assainissement non collectif.

Dictée technicien: "${transcription}"
Type d'intervention: ${type_intervention}
Ville: ${ville} (${cp})
Date: ${today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}

⛔ RÈGLES DE FIDÉLITÉ ⛔
- N'invente AUCUN fait, action, mesure, prix explicite, matériel, durée qui n'est pas dans la dictée
- Tu peux REFORMULER PROFESSIONNELLEMENT, CONTEXTUALISER avec du vocabulaire métier pertinent, DÉVELOPPER les idées déjà présentes, mais sans inventer d'éléments nouveaux
- Si un champ ne peut pas être rempli → chaîne vide "" ou tableau vide []
- "devis": null par défaut, sauf si le technicien mentionne explicitement des prix/montants
- "avis_technique": null sauf si le technicien exprime une préoccupation ou un diagnostic critique

⚠ RÈGLE STATUT "ok" / CONFORME ⚠
N'utilise JAMAIS "statut": "ok" (qui affichera "CONFORME" dans le rapport) par défaut ou pour combler. Ce statut est réservé aux cas où le technicien DIT EXPLICITEMENT que quelque chose est en bon état / conforme / sans problème / fonctionne correctement.
- Dans le doute → "statut": "neutral" (affichera "N/A") ou "statut": "info" (affichera "À PRÉVOIR").
- Pour une simple étape de contrôle final sans anomalie ET confirmée par le technicien : OK pour "ok".
- Ne met JAMAIS "ok" sur un élément dont le technicien n'a pas parlé explicitement.

📝 RÈGLES DE RÉDACTION — RAPPORT ÉTOFFÉ
- Ton : professionnel, technique, précis (éviter le langage parlé)
- Paragraphes développés : chaque champ texte doit contenir 4-6 phrases complètes minimum (sauf commentaire_technicien qui reste court)
- Vocabulaire métier : utilise les termes techniques exacts (fosse toutes eaux, fosse septique, bac dégraisseur, préfiltre, ventilation primaire/secondaire, filtre à sable, tertre d'infiltration, filière agréée, regard de bouclage, exutoire, infiltration, conformité au DTU 64.1, arrêté du 7 mars 2012, étude de sol, perméabilité K en mm/h, etc.)
- Structure : chaque section doit être autonome et compréhensible isolément
- Développe le contexte, la méthodologie, les résultats intermédiaires, sans inventer de données chiffrées

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :
{
  "objet": "objet complet et explicite du rapport (ex: 'Contrôle de bon fonctionnement d'une installation d'assainissement non collectif — Maison individuelle')",
  "contexte": "paragraphe de 3-5 phrases qui plante le décor : qui a mandaté, quel type de site, quelle problématique initiale signalée, date et objectif de l'intervention",
  "localisation": {
    "zone": "description détaillée de la zone d'intervention (3-4 phrases) : nature du lieu, niveau, configuration, point d'accès utilisé",
    "configuration": "description technique du réseau / installation (3-4 phrases) : âge apparent, matériaux, état général, particularités d'accès, absence ou présence de points de visite"
  },
  "diagnostic": "diagnostic complet en 5-7 phrases : constat initial, observations techniques, nature exacte du dysfonctionnement, cause probable, éléments aggravants si pertinents",
  "travaux_realises": "description détaillée des opérations effectuées en 5-7 phrases : ordre chronologique, techniques utilisées, outillage mis en œuvre, vérifications et contrôles intermédiaires, résultats obtenus à chaque étape",
  "materiel_utilise": ["liste du matériel effectivement utilisé ou cité", "sinon tableau vide"],
  "duree_intervention": "durée si mentionnée, sinon \\"\\"",
  "conditions_intervention": "conditions particulières rencontrées (accès, contraintes, présence client, difficultés) — 2-3 phrases si pertinent, sinon \\"\\"",
  "recommandations": "préconisations préventives détaillées en 3-5 phrases — si le technicien n'en a pas donné, laisse vide",
  "commentaire_technicien": "note interne courte — 1 phrase",
  "phases": [
    {
      "titre": "Phase N : Titre explicite",
      "statut": "ok|warn|critical",
      "contexte": "2-3 phrases : contexte de la phase, raison d'être de l'étape",
      "action": "2-3 phrases : actions précises entreprises",
      "resultat": "2-3 phrases : résultat obtenu et validation"
    }
  ],
  "avis_technique": null,
  "analyse_table": [
    { "probleme": "intitulé court", "localisation": "précision géographique", "description": "description en 1-2 phrases", "statut": "critical|warn|info|ok|neutral", "label": "✗ Urgent | ⚠ Attention | ⓘ À prévoir | ✓ Conforme | - N/A" }
  ],
  "preconisations": [],
  "devis": null
}

Si et seulement si le technicien mentionne explicitement des prix/montants/devis, remplace "devis": null par :
{
  "numero": "DV-${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${seq}",
  "validite_jours": 30,
  "lignes": [
    { "section": "A · Titre section", "designation": "Libellé court", "description": "", "qte": 1, "pu_ht": 850 }
  ],
  "tva_taux": 10,
  "conditions": ["Validité 30 jours.", "Acompte 30 % à la signature."]
}`

  // === APPEL 2 — SEO unique (contenu différent à chaque génération) ===
  const seoPrompt = `Tu es un rédacteur web expérimenté en assainissement non collectif (SPANC) local. Tu écris une page de référence client UNIQUE qui sera publiée sur ${SITE}.

🎙 TON ET VOIX — PRIORITÉ ABSOLUE 🎙
Cette page doit SONNER COMME UN ARTISAN QUI RACONTE SON CHANTIER, pas comme une brochure commerciale ni comme une fiche SEO générique. Objectif : que le lecteur se dise "ok, ces gens font vraiment le métier, je peux leur faire confiance".

Règles de ton :
- Utilise "on" (et "nous" parfois). Jamais "notre entreprise s'est déplacée", plutôt "on est arrivés sur place".
- Phrases courtes, rythmées, orales mais pas relâchées. Pas d'argot, pas de "tu".
- Raconte CE chantier précis comme une histoire : le contexte, ce qu'on a trouvé, ce qu'on a fait, ce qu'on a conseillé.
- Vocabulaire technique présent mais expliqué ("on a ouvert le préfiltre — la pièce qui retient les graisses avant l'épandage — pour voir comment il avait évolué").
- Pas de superlatifs commerciaux vides ("intervention ultra-rapide", "professionnels reconnus", "qualité premium"). Bannis-les.
- Pas d'urgence agressive type "APPELEZ MAINTENANT 24H/24 !!". La crédibilité fait le travail.
- Si la dictée nomme un repère local (rue, quartier), reprends-le — ça ancre la page.
- Reste factuel : si la dictée ne dit pas combien de temps ça a pris, ne l'invente pas.

Exemples d'ouvertures correctes :
- "Visite programmée chez un propriétaire à ${ville} dans le cadre d'une vente immobilière : il fallait diagnostiquer la filière d'assainissement avant signature."
- "Sur ce contrôle à ${ville}, l'installation datait des années 80 — fosse maçonnée d'origine, plus aucun plan."
- "Quand on arrive sur une filière ANC, on commence toujours par localiser les regards : c'est ce qui dit où passe vraiment l'eau."

⚠️ UNICITÉ SEO
La page doit être unique même si ville+service reviennent. Pour ça : ANCRE sur les détails concrets de la dictée (type de bâtiment, nature exacte du problème, méthode, résultat). ÉVITE les intros génériques interchangeables. VARIE la structure d'une page à l'autre (commence parfois par le contexte, parfois par le problème, parfois par la méthode).

CONTEXTE — DICTÉE DU TECHNICIEN (source de vérité, reformule pro mais sans inventer d'actions) :
"""
${transcription}
"""

Intervention : ${type_intervention} à ${ville} (${cp})
Référence unique : ${reference}

SERVICES DU SITE (pour maillage interne) :
${SERVICES.map(s => `- ${s.label} → ${SITE}/${s.slug}`).join('\n')}

PAGE VILLE DE DESTINATION (OBLIGATOIRE) :
- Page locale "${ville}" → ${cityUrl}
- Page Var → ${SITE}/spanc-var

URL FINALE : ${SITE}/nos-realisations/${realisationSlug}

⛔ NE PAS INVENTER D'ACTIONS TECHNIQUES absentes de la dictée. Tu peux contextualiser avec du savoir métier général, mais sans affirmer que le technicien a fait X si ce n'est pas dans la dictée.

RÈGLES SEO + GEO (rigoureuses, mais invisibles au lecteur)
- Titre H1 : max 75 car., UNIQUE et SPÉCIFIQUE (ville + type de contrôle + angle concret tiré du diagnostic). Privilégie une formulation descriptive (ex: "Diagnostic ANC avant vente à ${ville} — fosse septique d'origine et exutoire à requalifier") plutôt que promotionnelle.
- Meta description : 140-155 car., construction SEO + GEO + LLM :
  1. COMMENCE par ce qui a été fait (verbe d'action au passé) + ville : "Contrôle de bon fonctionnement à ${ville} sur..." / "Diagnostic ANC vente immobilière à ${ville} :...". C'est l'info que Google et les LLMs citent en priorité.
  2. INCLUS 2-3 entités concrètes et citables : type de filière, anomalie principale, conclusion. Exemple : "fosse toutes eaux 3 m³ + filtre à sable, préfiltre encrassé, installation conforme avec réserves".
  3. TERMINE par une micro-preuve ou une info utile : délai du rapport, agrément du diagnostiqueur, secteur d'intervention. PAS de slogan commercial vide.
  4. STYLE : phrase factuelle, complète, citable tel quel par un moteur IA — pas de promotionnel agressif, pas de majuscules, pas de points d'exclamation.
  Format type : "<Action + ville> : <détail problème + méthode + résultat>. <Info utile courte>."
- Résumé d'ouverture "LLM-ready" : 2 à 3 phrases factuelles (qui, quoi, où, résultat), lisible seule, citable par un moteur IA.
- Contenu HTML : 700-1100 mots, h2/h3 (4-6 h2 minimum), paragraphes courts (2-4 phrases), strong sur mots-clés locaux utilisés NATURELLEMENT dans la phrase, listes <ul> quand c'est pertinent (étapes, symptômes, causes).
- Intertitres orientés récit ou bénéfice lecteur, pas sloganesques. Ex : "Ce qu'on a trouvé sur place", "Pourquoi la filière n'était plus aux normes", "Comment fiabiliser l'installation pour les prochaines années".
- Conteneurs HTML à utiliser : <section class=\\"content-block\\">, <div class=\\"info-box\\"> (pour un point-clé ou conseil), <div class=\\"checklist-box\\"> (pour une liste d'étapes).
- MAILLAGE INTERNE : ≥ 3 liens vers les SERVICES + ≥ 2 liens vers la page ville (${cityUrl}) + 1 lien vers la page Var. Les liens doivent apparaître naturellement dans une phrase, pas collés en fin de paragraphe comme une liste SEO.
- Prix : placeholders {PRIX_MIN}/{PRIX_MAX} uniquement si un tarif est mentionné par le technicien.
- FAQ : 6 questions que de VRAIS clients se posent à ${ville} (longue traîne). Réponses courtes, honnêtes, sans langue de bois. Pas de "contactez-nous vite !" en fin de réponse.
- 8-12 mots-clés longue traîne, vrais termes de recherche humains.
- GEO / citabilité IA : phrases courtes, vérifiables, ancrage local précis, style factuel.

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks) :
{
  "titre_h1": "titre unique et spécifique — ne pas copier d'autres pages",
  "meta_description": "description unique avec angle distinctif",
  "resume_rich_snippet": "résumé court 2-3 phrases, factuel, citable, sans promo excessive",
  "meta_keywords": ["ville+service","longue traîne 1","longue traîne 2","..."],
  "contenu_principal": "<section class=\\"content-block\\"><h2>Contexte de l'intervention</h2><p>...</p></section><section class=\\"content-block\\"><h2>Diagnostic technique</h2><p>...<a href=\\"${SITE}/spanc/...\\">lien</a>...</p><div class=\\"info-box\\"><strong>Point clé :</strong> ...</div></section><section class=\\"content-block\\"><h2>Constats et conclusions</h2><h3>Étape 1 — ...</h3><p>...</p><div class=\\"checklist-box\\"><ul><li>...</li></ul></div></section><section class=\\"content-block\\"><h2>Recommandations</h2><p>...</p></section>",
  "faq": [
    {"question":"...","reponse":"..."},
    {"question":"...","reponse":"..."},
    {"question":"...","reponse":"..."},
    {"question":"...","reponse":"..."},
    {"question":"...","reponse":"..."},
    {"question":"...","reponse":"..."}
  ],
  "related_services": [
    {"label":"...","url":"${SITE}/spanc/..."},
    {"label":"...","url":"${SITE}/spanc/..."},
    {"label":"...","url":"${SITE}/spanc/..."}
  ]
}`

  // ===== Exécution parallèle =====
  let rapportMsg, seoMsg
  try {
    [rapportMsg, seoMsg] = await Promise.all([
      callWithRetry(() => client.messages.create({ model: MODEL, max_tokens: 6000, messages: [{ role: "user", content: rapportPrompt }] })),
      callWithRetry(() => client.messages.create({ model: MODEL, max_tokens: 6000, messages: [{ role: "user", content: seoPrompt }] })),
    ])
  } catch (e: any) {
    return NextResponse.json({ error: `Anthropic API : ${e.message || e.toString()}`, model: MODEL }, { status: 500 })
  }

  let rapport: any
  try {
    rapport = parseJson((rapportMsg.content[0] as { type: string; text: string }).text)
  } catch (e: any) {
    return NextResponse.json({ error: `Parsing rapport Claude : ${e.message}`, raw: (rapportMsg.content[0] as any)?.text?.slice(0, 500) }, { status: 500 })
  }

  let seo: any
  try {
    seo = parseJson((seoMsg.content[0] as { type: string; text: string }).text)
  } catch (e: any) {
    return NextResponse.json({ error: `Parsing SEO Claude : ${e.message}`, raw: (seoMsg.content[0] as any)?.text?.slice(0, 500) }, { status: 500 })
  }

  // Slug + référence déterministes côté serveur
  seo.slug = realisationSlug
  rapport.reference = reference
  seo.resume_rich_snippet = seo.resume_rich_snippet || seo.meta_description || ''

  const pageUrl = `${SITE}/nos-realisations/${realisationSlug}`
  const datePublished = today.toISOString()

  seo.jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${SITE}/#business`,
        "name": process.env.BRAND_NAME || "Spécialiste SPANC",
        "image": `${SITE}/images/logo.png`,
        "telephone": process.env.BRAND_PHONE || "+33000000000",
        "url": SITE,
        "priceRange": "€€",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": process.env.BRAND_STREET || "[Rue à compléter]",
          "addressLocality": process.env.BRAND_CITY || "[Ville à compléter]",
          "postalCode": process.env.BRAND_POSTAL_CODE || "00000",
          "addressRegion": process.env.BRAND_REGION || "[Région]",
          "addressCountry": "FR"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": Number(process.env.BRAND_LAT || 0),
          "longitude": Number(process.env.BRAND_LNG || 0)
        },
        "areaServed": [
          { "@type": "City", "name": ville },
          { "@type": "AdministrativeArea", "name": process.env.BRAND_REGION || "[Région]" }
        ],
        "openingHoursSpecification": [{
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        }],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": process.env.SPANC_RATING_VALUE || "4.9",
          "reviewCount": process.env.SPANC_REVIEW_COUNT || "127",
          "bestRating": "5",
          "worstRating": "1"
        },
        "currenciesAccepted": "EUR",
        "paymentAccepted": "Cash, Credit Card, Bank Transfer"
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        "name": `${type_intervention} ${ville}`,
        "provider": { "@id": `${SITE}/#business` },
        "areaServed": { "@type": "City", "name": ville },
        "serviceType": type_intervention,
        "description": seo.meta_description,
      },
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        "headline": seo.titre_h1,
        "description": seo.meta_description,
        "abstract": seo.resume_rich_snippet,
        "datePublished": datePublished,
        "dateModified": datePublished,
        "author": { "@type": "Organization", "name": process.env.BRAND_NAME || "Spécialiste SPANC" },
        "publisher": { "@id": `${SITE}/#business` },
        "mainEntityOfPage": pageUrl,
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        "mainEntity": (seo.faq || []).map((f: { question: string; reponse: string }) => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": { "@type": "Answer", "text": f.reponse }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE },
          { "@type": "ListItem", "position": 2, "name": "Nos réalisations", "item": `${SITE}/nos-realisations` },
          { "@type": "ListItem", "position": 3, "name": ville, "item": cityUrl },
          { "@type": "ListItem", "position": 4, "name": seo.titre_h1, "item": pageUrl }
        ]
      }
    ]
  }
  seo.page_url = pageUrl

  return NextResponse.json({ rapport, seo })
}
