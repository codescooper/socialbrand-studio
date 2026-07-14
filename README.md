# SocialBrand Studio

Application desktop Windows d’AWEMA pour appliquer un Brand Kit à des photos produits, adapter le format aux réseaux sociaux et exporter des visuels cohérents, individuellement ou par lot.

## Fonctionnalités de la bêta 0.1.0

- Brand Kits importables/exportables en JSON ;
- éditeur produit avec cadrage fidèle au rendu PNG/JPG ;
- formats Instagram, Facebook, LinkedIn et formats personnalisés ;
- projets locaux reprenables ;
- traitement de 50 images maximum avec ZIP et rapport ;
- historique réel, sauvegarde et restauration ;
- onboarding, aide et paramètres hors connexion.

Les fonctions cloud, IA, collaboration et publication directe ne font pas partie de cette bêta.

## Développement

Prérequis : Node.js 22, npm, Rust stable et les outils de compilation Visual Studio 2022 avec Windows SDK.

```bash
npm ci
npm run dev
npm run desktop:dev
```

Contrôles et builds :

```bash
npm run verify
npm run desktop:build
```

Les installateurs Windows sont produits dans `src-tauri/target/release/bundle/`.

## Architecture et données

React/TypeScript/Vite rend l’interface ; Tauri 2 fournit l’enveloppe desktop. IndexedDB/Dexie conserve Brand Kits, projets, historique, réglages et ressources nécessaires. Le rendu Canvas et JSZip fonctionnent localement : aucune image n’est envoyée à un serveur.

Avant une désinstallation ou un changement d’ordinateur, utilisez **Paramètres → Sauvegarder mes données**. Consultez [le guide utilisateur](docs/USER_GUIDE.md), [la confidentialité](docs/PRIVACY.md) et [le dépannage](docs/TROUBLESHOOTING.md).

## Limites connues

- bêta Windows 10/11 x64 non signée : SmartScreen peut afficher un avertissement ;
- les fichiers exportés ne sont pas conservés intégralement dans la base ;
- listes non virtualisées à très grande échelle ;
- sauvegarde v1 sans checksum interne cryptographique.

## Contribution et support

Voir [CONTRIBUTING.md](CONTRIBUTING.md) et [SECURITY.md](SECURITY.md). Les bugs peuvent être signalés dans les Issues GitHub sans joindre automatiquement de données locales.

Copyright AWEMA. Code propriétaire ; aucune licence de redistribution n’est accordée dans cette bêta.
