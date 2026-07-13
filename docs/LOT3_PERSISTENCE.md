# Lot 3 — persistance locale et historique

## Architecture

La base `socialbrand-studio` utilise IndexedDB via Dexie, schéma v1 :

- `brandKits`: `id, name, updatedAt`
- `projects`: `id, name, brandKitId, updatedAt, lastOpenedAt`
- `exports`: `id, projectId, batchJobId, status, exportedAt, filename`
- `batches`: `id, finishedAt, cancelled`
- `settings`: `key, updatedAt`
- `assets`: `id, type, lastUsedAt`

Les contenus ont leur propre champ `version`. Les composants React passent par les repositories ou services et ne lancent pas de transaction IndexedDB.

## Migration

Au premier démarrage, `sbs-brand-kits` et `sbs-brand-kit` sont lus, validés et réparés avec le validateur du Lot 1. La transaction écrit les Brand Kits et le marqueur `legacy-migration-v1` ensemble. Les identifiants déjà présents sont ignorés : une reprise est idempotente. Les anciennes clés restent conservées pendant cette version pour permettre un retour arrière.

## Ressources et exports

Une image source est stockée comme Blob uniquement quand l’utilisateur sauvegarde un projet, afin que celui-ci reste reprenable hors connexion. Les exports téléchargés ne sont pas dupliqués : l’historique conserve leurs métadonnées et indique qu’une régénération est nécessaire. Les ressources orphelines peuvent être détectées et supprimées explicitement.

## Sauvegarde

`socialbrand-backup-AAAA-MM-JJ.zip` contient un manifeste v1, les tables JSON et les ressources dans `assets/`. La restauration valide entièrement l’archive avant toute écriture. Le mode fusion remappe les collisions et les relations ; le mode remplacement valide d’abord l’archive puis remplace toutes les tables dans une transaction unique.

## Hors connexion

La police Google distante a été retirée. Le stockage, l’ouverture d’un projet, le rendu et l’export n’utilisent ni API, ni CDN, ni ressource distante. Tauri demeure la cible prioritaire.

## Limites connues

- Les exports ne sont volontairement pas conservés en Blob ; ils doivent être régénérés depuis le projet.
- Les listes sont triées/indexées mais pas encore virtualisées ; la pagination deviendra utile à plusieurs milliers d’éléments.
- La vérification cryptographique du manifeste n’est pas incluse dans le format v1.
- Les dialogues utilisent les confirmations système ; ils sont accessibles au clavier mais ne proposent pas encore un focus personnalisé.
