# Contribuer

Créez une branche depuis `master`, gardez les changements ciblés et n’ajoutez jamais de données utilisateur ou de secrets. Avant une pull request, exécutez `npm ci` puis `npm run verify`. Toute évolution de version doit modifier ensemble `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` et l’interface.
