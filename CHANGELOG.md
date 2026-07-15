# Changelog

Format inspiré de Keep a Changelog. Le projet suit le versionnage sémantique.

## [0.4.0] - 2026-07-15

### Added

- Authentification cloud facultative par lien magique.
- Espaces business et rôles `owner`, `admin`, `editor`, `viewer`.
- Liaison sécurisée des Brand Kits locaux aux espaces business.
- Schéma Supabase avec RLS, états OAuth, connexions sociales, synchronisations et audit.
- Coffre serveur AES-GCM versionné pour les futurs credentials sociaux.
- Edge Function sécurisée pour créer les espaces et lier les Brand Kits.
- Contrôle automatique de l’absence de secrets serveur dans le frontend.

### Security

- Aucun accès frontend aux tables de credentials et d’états OAuth.
- Origines Edge Functions en liste blanche.
- Rôles et isolation multi-business appliqués au niveau PostgreSQL.

## [0.3.0] - 2026-07-15

### Added

- Onglet Réseaux associé au Brand Kit actif avec profils manuels Facebook, Instagram, TikTok et LinkedIn.
- Schéma IndexedDB v2 pour comptes, métriques, publications et métriques de publications sociales.
- Tableau de santé digitale fondé uniquement sur des snapshots locaux réels et états « Données indisponibles » explicites.
- Contrats des futurs connecteurs API, brouillons de contenu et cibles de publication, sans implémentation réseau.
- Validation stricte des profils, repositories transactionnels et calculs purs de comparaison et d’engagement.

### Changed

- Sauvegardes enrichies avec les tables sociales et restauration compatible avec les archives 0.2.0.
- Navigation et mise en page adaptées aux petits écrans et à l’installation PWA.

### Security

- Aucun mot de passe, jeton, secret, cookie ou clé API n’est demandé ou stocké.
- Aucune URL de profil n’est chargée automatiquement et aucune API sociale n’est appelée.

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
