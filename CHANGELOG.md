# Changelog

Format inspiré de Keep a Changelog. Le projet suit le versionnage sémantique.

## [0.2.0] - 2026-07-14

### Added

- Manifeste PWA, identité d’installation jaune/noir et service worker hors connexion.
- Proposition d’installation et indicateur de perte de connexion dans l’interface.
- Déploiement statique automatisé vers GitHub Pages.

### Changed

- La branche principale cible désormais les navigateurs modernes et l’installation PWA.
- Les liens externes utilisent l’API Web native et le stockage reste dans IndexedDB.
- La version Desktop 0.1.0 est archivée dans `codex/archive-desktop-v0.1.0`.

## [0.1.0] - 2026-07-14

### Added

- Brand Kits, éditeur individuel, projets, historique, sauvegarde/restauration et traitements par lot.
- Onboarding, aide hors connexion, paramètres appliqués et checklist de démarrage réelle.
- CI, builds Windows et workflow de release avec checksums SHA-256.

### Changed

- Interface recentrée sur les fonctions disponibles ; éléments fictifs retirés.
- Dépendances frontend fixées à des versions exactes.

### Fixed

- Aperçu et export utilisent le même moteur de rendu.
- Persistance idempotente et restauration transactionnelle.

### Security

- CSP Tauri active et permission d’ouverture externe limitée au formulaire GitHub du projet.
- Imports d’images, JSON et sauvegardes validés avant traitement.

### Known issues

- Installateurs Windows non signés tant qu’AWEMA ne fournit pas de certificat de signature de code.
- SmartScreen peut demander une confirmation à l’installation.
