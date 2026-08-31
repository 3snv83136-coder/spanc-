# Export SISPEA — Compétence ANC (SPANC)

> Spec d'intégration pour le SaaS. Objectif : générer automatiquement le fichier d'import SISPEA
> à partir des données terrain, pour supprimer la double saisie annuelle du RPQS.
> Référencé depuis le module d'export `/sispea`.

---

## 1. Principe : import de FICHIER, pas d'API

SISPEA **n'expose pas d'API REST** pour pousser les données. Le canal officiel est l'**import en masse**
via un fichier que la collectivité dépose sur le portail (`services.eaufrance.fr`).

Notre app ne fait donc **pas** de push automatique temps réel. Elle **génère le fichier**, l'utilisateur
le charge en un clic, SISPEA valide et confirme par mail. C'est ça, notre « connexion directe ».

**Formats acceptés :** `.csv`, `.xml`, `.ods`
**Format retenu :** `.csv`, séparateur **`;`** (point-virgule), encodage UTF-8.

⚠️ **Source de vérité des noms de colonnes = le fichier modèle officiel.** SISPEA fournit un modèle
préconstruit par **compétence (ANC)** et par **exercice (année)**, téléchargeable depuis la page
« Envoyer des données au site ». Les en-têtes exacts doivent être repris de CE fichier, pas codés en
dur depuis cette doc (les codes peuvent évoluer d'un exercice à l'autre). Voir §7 TODO.

---

## 2. Ce qu'on doit produire : les 3 indicateurs réglementaires ANC

La compétence ANC a **3 indicateurs** au RPQS (arrêté du 2 mai 2007 modifié) :

| Code | Libellé | Type | Décimales |
|------|---------|------|-----------|
| **D301.0** | Évaluation du nombre d'habitants desservis par le SPANC | descriptif | entier |
| **D302.0** | Indice de mise en œuvre de l'ANC (0 à 140) | descriptif | 1 |
| **P301.3** | Taux de conformité des dispositifs d'ANC | performance | 1 |

**Règle clé — ne PAS envoyer D302.0 en direct.** D302.0 fait partie des indicateurs
**auto-calculés par SISPEA**. On envoie les **7 variables composantes** (les éléments OUI/NON,
codes `VP.168` à `VP.174`) et SISPEA recalcule l'indice. Idem : si un champ a `AUTO_COMPUTE = Oui`,
n'y mettre une valeur que si on veut **désactiver** le calcul auto.

Indicateurs auto-calculés à **exclure** du fichier (tous compétences confondues) :
`P103.2B, P202.2B, P206.3, P204.3, P255.3, D203.0, D302.0`.

---

## 3. Détail des indicateurs

### D301.0 — Habitants desservis
Estimation de la population raccordée à un dispositif ANC sur le territoire du SPANC.
→ **Donnée à collecter/estimer** : population desservie (entier).

### D302.0 — Indice de mise en œuvre de l'ANC (0–140)
Calculé par SISPEA à partir de 7 éléments OUI/NON (variables `VP.168`–`VP.174`).
Grille réglementaire (à mapper sur les 7 variables — **confirmer l'ordre exact via le fichier modèle**) :

**Partie A — obligatoires (100 pts, tout ou rien)**
- 20 — Délimitation des zones d'ANC par délibération
- 20 — Application d'un règlement de service approuvé par délibération
- 30 — Vérification de la conception ET de l'exécution des installations réalisées/réhabilitées depuis < 8 ans
- 30 — Diagnostic de bon fonctionnement et d'entretien sur les autres installations

**Partie B — facultatifs (40 pts, seulement si les 100 sont acquis)**
- +10 — Service capable d'assurer, à la demande du propriétaire, l'entretien des installations
- +20 — Service capable d'assurer, à la demande, les travaux de réalisation/réhabilitation
- +10 — Service capable d'assurer le traitement des matières de vidange

→ **Données à collecter** : 7 booléens (settings au niveau du service, pas par installation).

### P301.3 — Taux de conformité
```
P301.3 = (installations conformes OU mises en conformité, validées) / (total installations contrôlées) × 100
```
Périmètre : **depuis la création du SPANC** (cumul, pas seulement l'exercice).
→ **Données à collecter** : `nb_installations_controlees_total`, `nb_installations_conformes_total`.
Laisser SISPEA calculer P301.3 depuis ces variables si `AUTO_COMPUTE = Oui` sur cet indicateur.

---

## 4. Modèle de données à prévoir dans l'app

Deux niveaux : **Service** (le SPANC) et **Installation/Ouvrage**.

```ts
// Niveau SERVICE (une ligne par SPANC et par exercice)
type ServiceExerciceANC = {
  serviceIdSispea: string;      // SERVICE_ID — obligatoire, fourni par SISPEA
  annee: number;                // ANNEE (exercice)
  equipementIdSispea: string;   // EQUIPEMENT_ID — obligatoire

  // D301.0
  habitantsDesservis: number;

  // D302.0 — composantes (VP.168 → VP.174), booléens
  zonageDelibere: boolean;
  reglementServiceDelibere: boolean;
  controleConceptionExecutionNeuf: boolean;
  diagnosticBonFonctionnement: boolean;
  serviceEntretien: boolean;
  serviceTravaux: boolean;
  serviceTraitementMatieresVidange: boolean;

  // P301.3 — variables sources (cumul depuis création du SPANC)
  nbInstallationsControleesTotal: number;
  nbInstallationsConformesTotal: number;
};
```

Chaque contrôle terrain incrémente le cumul `nbInstallationsControlees*` / `nbInstallationsConformes*`.
Les 7 booléens D302.0 sont des **réglages du service**, éditables dans les paramètres (pas par contrôle).

---

## 5. Règles techniques du fichier d'import (à respecter sinon rejet)

- **Colonnes obligatoires** dans chaque ligne :
  - `SERVICE_ID` — identifiant SISPEA du service
  - `ANNEE` — exercice
  - `EQUIPEMENT_ID` — identifiant SISPEA de l'ouvrage
- **Séparateur CSV** : `;`
- **Un fichier peut contenir plusieurs collectivités** et plusieurs entités.
- **Statut requis** : l'import ne marche que sur des entités en statut *« en attente de saisie »*
  ou *« en cours de saisie »*.
- **Écrasement** : réimporter écrase les valeurs existantes. Réimport possible autant de fois que voulu.
  - Colonne **présente mais vide** → SISPEA **efface** la donnée existante.
  - Colonne **absente** → la donnée existante est **conservée**.
  - ⇒ Pour ne rien effacer par accident, **ne mettre dans le fichier que les colonnes qu'on veut écrire.**
- **Variables OUI/NON en ANC** : `VP.168` à `VP.174`. Valeurs acceptées : `Oui`/`Non` ou `1`/`0`.
- **Arrondis** : respecter le nombre de décimales imposé (D302.0 → 1 ; P301.3 → 1 ; D301.0 → entier).
- **Astuce PANANC** : dès qu'**une seule** variable PANANC est présente dans le fichier, SISPEA ajoute
  automatiquement **tout** le bloc PANANC à la liste des données à saisir sur l'entité. À gérer si on
  ne veut pas déclencher le bloc complet involontairement.

---

## 6. Prérequis référentiel — LE point de blocage à anticiper

L'import ne fonctionne QUE si les identifiants existent déjà et sont justes côté SISPEA :

- Un `SERVICE_ID` ou `EQUIPEMENT_ID` **faux ou non référencé → tout l'import est bloqué** (pas partiel).
- Les corrections de référentiel (créer/corriger une entité de gestion, un ouvrage) passent par le
  **gestionnaire local en DDT/M ou DEAL**, pas par la collectivité directement.
- ⇒ **À implémenter** : stocker et vérifier `SERVICE_ID` / `EQUIPEMENT_ID` par service dès l'onboarding.
  Prévoir un écran « référentiel SISPEA » où le gérant saisit/valide ces IDs avant le premier export.

Retour d'import : SISPEA confirme **par mail**.
- Mail avec *« erreurs »* → **tout** l'import est bloqué (vérifier référentiel + règles).
- Mail avec *« avertissements »* → seule la valeur concernée n'est pas importée, le reste passe.

⚠️ L'import **ne dispense pas** d'aller sur SISPEA récupérer l'**attestation de saisie** — nécessaire
pour bénéficier des aides des Agences de l'eau. Prévoir un rappel utilisateur post-export.

---

## 7. TODO avant la mise en prod (à caler sur le fichier modèle officiel)

- [ ] Télécharger le **fichier modèle ANC** pour l'exercice courant depuis SISPEA (« Envoyer des données au site »).
- [ ] Récupérer les **en-têtes de colonnes exacts** (le générateur doit refléter ces noms, pas ceux de cette doc).
- [ ] Confirmer le **mapping VP.168–VP.174 ↔ les 7 éléments D302.0** (ordre exact).
- [ ] Récupérer les **codes VP** des variables sources de P301.3 (nb contrôlées / nb conformes) + D301.0.
- [ ] Vérifier la présence et la valeur des colonnes `AUTO_COMPUTE` pour D302.0 et P301.3.
- [x] Implémenter la génération CSV `;` UTF-8 + validation locale (colonnes obligatoires, arrondis, OUI/NON).
- [x] Écran référentiel SISPEA (SERVICE_ID / EQUIPEMENT_ID) + garde-fou avant export.
- [x] Rappel post-export : « récupérer l'attestation de saisie sur SISPEA ».

---

## 8. Bonus lecture — benchmark open data

SISPEA publie ses données en **open data** (`services.eaufrance.fr` → Téléchargement, et `data.gouv.fr`).
Ingérables pour afficher à une collectivité son positionnement vs moyenne départementale/nationale.
Argument commercial séparé de l'export ; ne bloque pas la V1.
