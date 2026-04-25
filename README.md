# app-spanc

Application back-office pour les métiers du **SPANC** (Service Public d'Assainissement Non Collectif) :
diagnostiqueurs ANC, installateurs, vidangeurs agréés, contrôleurs SPANC, bureaux d'études en assainissement.

Trois flux principaux, à partir d'une dictée vocale terrain :

1. **Rapport de contrôle** — contrôle de bon fonctionnement, diagnostic vente immobilière, contrôle de conception/réalisation. Génère un rapport PDF, un mail client et une page web SEO/GEO publiable sur le site de l'entreprise.
2. **Devis SPANC** — installation neuve, réhabilitation, vidange, entretien. Devis structuré en sections (études & terrassement, pose de la filière, épandage, vidange, remise en état) avec TVA 10 % logements > 2 ans.
3. **Attestation de conformité ANC** — destinée au notaire dans le cadre d'une vente immobilière (raccordement collectif / installation ANC conforme / non-conforme).

## Stack

Next.js 14 (App Router), React 18, TypeScript, Tailwind, NextAuth, `@react-pdf/renderer`,
Anthropic Claude (extraction + génération), OpenAI Whisper (transcription), Resend (mail).

## Démarrage

```bash
npm install
cp .env.local.example .env.local   # remplir les clés
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Configuration

Variables d'environnement principales (voir `.env.local.example`) :

- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- `BRAND_NAME`, `BRAND_PHONE`, `BRAND_STREET`, `BRAND_CITY`, `BRAND_POSTAL_CODE`, `BRAND_REGION`, `BRAND_LAT`, `BRAND_LNG` — identité de l'entreprise (utilisée dans les PDFs et le JSON-LD schema.org)
- `SPANC_API_URL`, `SPANC_PUBLISH_TOKEN` — endpoint Django/CMS pour publier les pages SEO
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `GOOGLE_REVIEW_URL` — mail transactionnel + lien avis Google
- Comptes techniciens : `AUTH_USER_1` … (format `nom:bcrypt_hash`)

## Déploiement

Voir `DEPLOYMENT.md` et `DEPLOYMENT_CHECKLIST.md`. Cible par défaut : Vercel.

## Personnalisation

- **Nom & charte de la marque** : ajustez `app/page.tsx` (titre H1 « SPANC ») et les variables `BRAND_*`.
- **Liste des communes** : `lib/villes-var.ts` couvre les 101 communes du Var (83). Remplacez ce fichier par la liste des communes de votre secteur.
- **Types d'intervention** : `app/nouveau/page.tsx` et `app/api/extract/route.ts` pour la liste des contrôles SPANC.
- **Services & SEO** : `app/api/generate/route.ts` — tableau `SERVICES`, slugs et JSON-LD.
