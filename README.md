# SocialBrand Studio

PWA locale d’AWEMA pour appliquer un Brand Kit à des photos produits, adapter le format aux réseaux sociaux et exporter des visuels cohérents, individuellement ou par lot.

## Fonctionnalités de la PWA 0.3.0

- Brand Kits importables/exportables en JSON ;
- éditeur produit avec cadrage fidèle au rendu PNG/JPG ;
- formats Instagram, Facebook, LinkedIn et formats personnalisés ;
- projets locaux reprenables ;
- traitement de 50 images maximum avec ZIP et rapport ;
- historique réel, sauvegarde et restauration ;
- profils sociaux publics associés à chaque Brand Kit, stockés localement ;
- tableau de santé digitale prêt pour de futures métriques réelles, sans valeurs simulées ;
- onboarding, aide et paramètres hors connexion.

Les connexions OAuth, appels aux API sociales, fonctions cloud, IA, collaboration et publication directe ne font pas partie de cette version.

## Installation

Ouvrez l’URL HTTPS de l’application avec Chrome, Edge ou un navigateur compatible, puis choisissez **Installer SocialBrand Studio** dans l’interface ou dans le menu du navigateur. Une fois le premier chargement terminé, le studio peut être ouvert hors connexion.

## Développement

Prérequis : Node.js 22 et npm.

```bash
npm ci
npm run dev
```

Contrôles et builds :

```bash
npm run verify
npm run build
npm run preview
```

Le site statique prêt à héberger est produit dans `dist/`. Le déploiement GitHub Pages est automatisé lors d’un push sur `master`.

## Architecture et données

React/TypeScript/Vite rend l’interface. IndexedDB/Dexie conserve Brand Kits, profils sociaux publics, projets, historique, réglages et ressources nécessaires dans le profil du navigateur. Le rendu Canvas et JSZip fonctionnent localement : aucune image ni donnée sociale n’est envoyée à un serveur.

Avant de supprimer les données du site ou de changer d’appareil, utilisez **Paramètres → Sauvegarder mes données**. Consultez [le guide utilisateur](docs/USER_GUIDE.md), [la confidentialité](docs/PRIVACY.md) et [le dépannage](docs/TROUBLESHOOTING.md).

La version Desktop 0.1.0 reste archivée sur la branche `codex/archive-desktop-v0.1.0`.

## Limites connues

- l’installation PWA requiert HTTPS, sauf en développement sur localhost ;
- le stockage est lié au navigateur, au profil et au domaine utilisés ;
- les fichiers exportés ne sont pas conservés intégralement dans la base ;
- listes non virtualisées à très grande échelle ;
- sauvegarde v1 sans checksum interne cryptographique.

## Contribution et support

Voir [CONTRIBUTING.md](CONTRIBUTING.md) et [SECURITY.md](SECURITY.md). Les bugs peuvent être signalés dans les Issues GitHub sans joindre automatiquement de données locales.

Copyright AWEMA. Code propriétaire ; aucune licence de redistribution n’est accordée.
