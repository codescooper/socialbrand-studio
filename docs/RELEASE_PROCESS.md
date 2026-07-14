# Publication de la bêta

Versions : correctifs `0.1.x`, fonctionnalités compatibles `0.2.0`, stable future `1.0.0`.

1. Mettre à jour les trois versions et `CHANGELOG.md`.
2. Exécuter `npm ci`, `npm run verify` et `npm run desktop:build`.
3. Fusionner la PR validée dans `master`.
4. Créer manuellement le tag autorisé, par exemple `v0.1.0`.
5. Le workflow Release vérifie, construit NSIS/MSI, calcule les SHA-256 et publie les artefacts.

Aucun tag ni Release ne doit être créé sans autorisation explicite. En l’absence de certificat AWEMA, les artefacts restent clairement non signés.
