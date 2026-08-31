import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import {
  TypeControle,
  AvisConformite,
  UsagerSPANC,
  FiliereSPANC,
  TYPE_CONTROLE_LABELS,
  PRETRAITEMENT_LABELS,
  TRAITEMENT_LABELS,
  REJET_LABELS,
  POINTS_CONTROLES_STANDARDS,
  prochaineEcheanceParDefaut,
  genererNumeroRapport,
} from "@/lib/types/spanc"

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5"

interface RequestBody {
  typeControle: TypeControle
  usager: UsagerSPANC
  filiere: FiliereSPANC
  dictee: string
  checkboxes?: Record<string, boolean>
  niveauBoues?: number
  avisAgent?: AvisConformite
  technicien?: string
  dateControle?: string
  /** Conserve le numéro provisoire généré hors ligne */
  numeroRapport?: string
}

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastErr: unknown
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
      const delay = Math.min(1200 * Math.pow(2, attempt - 1), 8000) + Math.random() * 600
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

function parseJson(raw: string): any {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  try { return JSON.parse(cleaned) } catch {}
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
  if (lastBrace > 0) {
    try { return JSON.parse(cleaned.slice(0, lastBrace + 1)) } catch {}
  }
  throw new Error('Réponse IA non JSON')
}

function buildSystemPrompt(typeControle: TypeControle): string {
  const typeLabel = TYPE_CONTROLE_LABELS[typeControle]?.label || typeControle
  return `Tu es un technicien expert du Service Public d'Assainissement Non Collectif (SPANC) de l'Agglomération de Sens (Yonne — 89).

Tu rédiges des rapports de contrôle officiels conformes :
- à l'arrêté du 7 septembre 2009 fixant les prescriptions techniques applicables aux installations d'ANC
- à l'arrêté du 27 avril 2012 relatif aux modalités d'exécution de la mission de contrôle
- au DTU 64.1 P1-1 (mars 2013)

Le contrôle en cours est : ${typeLabel}.

GRILLE OFFICIELLE DE CLASSEMENT (Annexe II de l'arrêté du 27 avril 2012) — pour les contrôles
périodiques et diagnostics de vente (installations existantes), tu DOIS fixer "avis_final"
STRICTEMENT selon ce tableau de synthèse, sans improviser d'autres critères :

1. Défaut de sécurité sanitaire (contact possible avec les eaux usées prétraitées ou non, sur
   ou hors parcelle ; vecteurs de maladies / prolifération d'insectes en zone de lutte
   antiparasitaire ; nuisances olfactives constatées le jour du contrôle ou signalées à la
   commune), OU défaut de structure/fermeture des ouvrages dangereux pour la sécurité des
   personnes (couvercle non sécurisé, défaut électrique), OU implantation à moins de 35 mètres
   en amont hydraulique d'un puits privé destiné à l'alimentation humaine
   → "non_conforme_risque_sanitaire". Délai de travaux : 4 ans (1 an si contrôle de type "vente").

2. Installation incomplète (ex : fosse septique seule sans traitement, prétraitement seul,
   rejet d'eaux brutes en puisard/puits perdu/cours d'eau, fosse étanche avec trop-plein), OU
   sous-dimensionnement significatif (capacité de l'installation inférieure au flux de
   pollution à traiter dans un rapport de 1 à 2, c'est-à-dire capacité < moitié du besoin), OU
   dysfonctionnement majeur (prétraitement dégradé, drains engorgés, micro-station défaillante)
   → "non_conforme". Délai 4 ans (1 an si "vente").
   → Si en plus l'installation est située en zone à enjeu SANITAIRE (aire d'alimentation de
     captage AEP, zone de baignade) : requalifie en "non_conforme_risque_sanitaire" (danger
     pour la santé des personnes).
   → Si en zone à enjeu ENVIRONNEMENTAL (zone conchylicole, cours d'eau sensible) : garde
     "non_conforme" mais mentionne explicitement le "risque avéré de pollution de
     l'environnement" dans "evaluation_conformite".

3. Défauts d'entretien ou d'usure SEULS (aucun défaut des points 1-2) : niveau de boues élevé
   sans dépassement critique, ventilation partiellement défaillante, végétation sur l'épandage,
   regard difficile d'accès, etc.
   → "conforme_recommandations". Pas de délai de travaux obligatoire, juste des recommandations.

4. Aucun défaut ci-dessus, installation complète, correctement dimensionnée, entretenue, hors
   zone à enjeu → "conforme".

Prescriptions techniques de référence (arrêté du 7 septembre 2009 modifié — à vérifier/citer
si pertinent dans "evaluation_conformite" ou "prescriptions") :
- Fosse toutes eaux : volume utile ≥ 3 m³ jusqu'à 5 pièces principales, + 1 m³ par pièce
  supplémentaire ; hauteur utile ≥ 1 m.
- Ventilation : entrée d'air + extraction en hauteur, diamètre ≥ 100 mm.
- Tranchées d'épandage : tuyaux ⌀ ≥ 100 mm, longueur ≤ 30 m par tranchée, largeur ≥ 0,50 m,
  espacement axe à axe ≥ 1,50 m, profondeur entre 0,60 m et 1 m.
- Filtre à sable vertical drainé : surface ≥ 5 m²/pièce principale, minimum 20 m² au total.
- Rejet vers puisard, puits perdu, puits désaffecté ou cavité naturelle/artificielle profonde :
  INTERDIT.
- Rejet en milieu hydraulique superficiel autorisé seulement si aucune autre solution
  d'évacuation (notamment infiltration dans le sol) n'est envisageable.
- Boues : la hauteur de boues ne doit pas dépasser 50 % du volume utile de la fosse ; au-delà,
  prescris une vidange même si l'avis global reste "conforme_recommandations".

Si le contrôle est de type "conception" ou "exécution" (installation neuve ou réhabilitation
avant remblaiement), le tableau de classement ci-dessus (pensé pour les installations
existantes) ne s'applique pas : évalue plutôt la conformité du projet/des travaux aux
prescriptions techniques de dimensionnement ci-dessus, et fixe "avis_final" à "conforme" si le
projet/les travaux les respectent, "non_conforme" sinon (délai : mise en conformité avant
poursuite des travaux, pas de délai en années).

À partir des observations dictées par le technicien sur le terrain, tu structures un rapport JSON avec EXACTEMENT les clés suivantes :
{
  "constat_technique": "Paragraphe précis (3-6 phrases) décrivant l'installation : type, dimensionnement, état général, accessibilité.",
  "points_controles": [
    { "label": "...", "statut": "conforme" | "non_conforme" | "non_verifie" }
  ],
  "evaluation_conformite": "Paragraphe (4-8 phrases) analysant le fonctionnement au regard de la réglementation en vigueur. Cite les arrêtés.",
  "prescriptions": [ "..." ],
  "observations_technicien": "Remarques libres en 2-4 phrases (état d'entretien, recommandations particulières).",
  "avis_final": "conforme" | "conforme_recommandations" | "non_conforme" | "non_conforme_risque_sanitaire",
  "prochaine_echeance": "10 ans" | "4 ans" | "3 ans" | "1 an"
}

Règles :
- Si "avis_final" = "conforme" : "prescriptions" est un tableau vide [].
- Si "non_conforme" : prescriptions obligatoires avec délai 4 ans.
- Si "non_conforme_risque_sanitaire" : prescriptions urgentes avec délai 1 an.
- Si type = "vente" : prochaine_echeance = "3 ans" (validité du diagnostic).
- Sinon conforme = "10 ans".
- Le tableau "points_controles" reprend chaque item de la grille de contrôle fournie + ajoute des points pertinents identifiés dans la dictée.
- Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaire, sans préambule.`
}

function buildUserPrompt(b: RequestBody): string {
  const u = b.usager
  const f = b.filiere
  const checks = b.checkboxes || {}
  const checkLines = POINTS_CONTROLES_STANDARDS
    .map(p => `- ${p.label} : ${checks[p.key] ? 'CONFORME' : 'NON VÉRIFIÉ ou NON CONFORME'}`)
    .join('\n')

  const filiereLines = [
    f.typePretraitement && `Prétraitement : ${PRETRAITEMENT_LABELS[f.typePretraitement as keyof typeof PRETRAITEMENT_LABELS] || f.typePretraitement}${f.volumePretraitement ? ` (${f.volumePretraitement} m³)` : ''}`,
    f.typeTraitement && `Traitement : ${TRAITEMENT_LABELS[f.typeTraitement as keyof typeof TRAITEMENT_LABELS] || f.typeTraitement}`,
    f.typeRejet && `Rejet : ${REJET_LABELS[f.typeRejet as keyof typeof REJET_LABELS] || f.typeRejet}`,
    f.dateInstallation && `Date installation : ${f.dateInstallation}`,
    f.derniereVidange && `Dernière vidange : ${f.derniereVidange}`,
    typeof b.niveauBoues === 'number' && `Niveau de boues : ${b.niveauBoues}%`,
  ].filter(Boolean).join('\n')

  return `Voici les éléments collectés sur le terrain :

USAGER & BIEN
- ${u.prenom} ${u.nom}
- ${u.adresse}, ${u.codePostal} ${u.commune}
- Cadastre : section ${u.sectionCadastrale || '—'} parcelle ${u.numeroParcelle || '—'}
${u.nbPiecesPrincipales ? `- Nombre de pièces principales : ${u.nbPiecesPrincipales}` : ''}

FILIÈRE ANC
${filiereLines || '(non renseignée)'}

GRILLE DE CONTRÔLE TERRAIN
${checkLines}

DICTÉE DU TECHNICIEN
"""
${b.dictee}
"""

${b.avisAgent ? `Le technicien propose l'avis suivant : ${b.avisAgent}. Tu peux le suivre ou le réviser si la dictée le justifie.` : ''}

Rédige le rapport JSON en respectant strictement le schéma demandé.`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody

    if (!body.dictee || body.dictee.trim().length < 20) {
      return NextResponse.json({ error: 'Dictée trop courte (min. 20 caractères).' }, { status: 400 })
    }
    if (!body.typeControle) {
      return NextResponse.json({ error: 'Type de contrôle manquant.' }, { status: 400 })
    }
    if (!body.usager?.commune) {
      return NextResponse.json({ error: 'Commune manquante.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || !apiKey.startsWith('sk-ant')) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée.' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 2200,
        system: buildSystemPrompt(body.typeControle),
        messages: [{ role: 'user', content: buildUserPrompt(body) }],
      })
    )

    const textBlock = response.content.find((c: any) => c.type === 'text') as { type: 'text'; text: string } | undefined
    if (!textBlock?.text) {
      return NextResponse.json({ error: 'Réponse IA vide.' }, { status: 502 })
    }

    let rapportIA: any
    try {
      rapportIA = parseJson(textBlock.text)
    } catch (e: any) {
      return NextResponse.json({ error: 'Réponse IA non parseable.', raw: textBlock.text.slice(0, 400) }, { status: 502 })
    }

    const avisFinal: AvisConformite = rapportIA.avis_final || body.avisAgent || 'conforme'
    const prochaineEcheance = rapportIA.prochaine_echeance || prochaineEcheanceParDefaut(avisFinal, body.typeControle)
    const numeroRapport = body.numeroRapport || genererNumeroRapport()

    return NextResponse.json({
      rapport: {
        numeroRapport,
        typeControle: body.typeControle,
        dateControle: body.dateControle || new Date().toISOString().slice(0, 10),
        technicien: body.technicien || '',
        usager: body.usager,
        filiere: body.filiere,
        checkboxes: body.checkboxes || {},
        dicteeText: body.dictee,
        constatTechnique: rapportIA.constat_technique || '',
        pointsControles: Array.isArray(rapportIA.points_controles) ? rapportIA.points_controles : [],
        evaluationConformite: rapportIA.evaluation_conformite || '',
        prescriptions: Array.isArray(rapportIA.prescriptions) ? rapportIA.prescriptions : [],
        observationsTechnicien: rapportIA.observations_technicien || '',
        avisConformite: avisFinal,
        prochaineEcheance,
      },
    })
  } catch (e: any) {
    const msg = String(e?.message || e)
    return NextResponse.json({ error: `Erreur génération rapport SPANC : ${msg}` }, { status: 500 })
  }
}
