# SPANC Sens — Application bureau

Version Electron qui ouvre SPANC dans une fenêtre native (Mac `.dmg` ou Windows `.exe`).

## Lancer en développement

```bash
cd desktop
npm install
npm start
```

## Compiler un installateur

**Sur Mac** (fichier `.dmg` dans `desktop/dist/`) :

```bash
npm run build:mac
```

**Sur Windows** (fichier `.exe` dans `desktop/dist/`) :

```bash
npm run build:win
```

## URL du serveur

Par défaut : `https://spanc-sens.vercel.app`

Pour pointer vers un autre environnement :

```bash
SPANC_URL=http://localhost:3000 npm start
```

## Alternative plus simple (recommandée)

Depuis Chrome ou Edge, ouvrez le site et utilisez **Installer l'application** (PWA).
Page d'aide : `/telecharger` sur le site.
