# Publication de la PWA

Versions : correctifs `0.1.x`, fonctionnalités compatibles `0.2.0`, stable future `1.0.0`.

1. Mettre à jour les versions de `package.json`, `public/manifest.webmanifest`, `APP_VERSION` et `CHANGELOG.md`.
2. Exécuter `npm ci`, `npm run verify` et `npm run build`.
3. Fusionner la PR validée dans `master`.
4. Le workflow **Deploy PWA** construit `dist/` et le publie sur GitHub Pages.
5. Tester l’URL publiée, l’installation, un rechargement et le mode hors connexion.

Un tag reste facultatif pour marquer une version. Le déploiement Web ne nécessite ni installateur Windows ni certificat de signature de code.
