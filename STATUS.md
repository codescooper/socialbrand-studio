# SocialBrand Studio

**Dernière MAJ : 2026-07-16**

## 🎯 Phase

Lot 5B finalisé sur la branche `codex/lot-5b-secure-backend-foundation`, prêt pour validation finale de la PR #6.

## ✅ Fait

- [x] Fondation Supabase déployée : 9 tables, RLS sur 9 tables et migration `20260715052530` appliquée.
- [x] Authentification facultative par lien magique, espaces business, rôles et liaison sécurisée des Brand Kits.
- [x] Edge Function `business-workspaces` déployée avec origines locales et GitHub Pages autorisées.
- [x] Secrets serveur configurés hors du frontend et variables publiques ajoutées au build GitHub Pages.
- [x] URL principale et redirections Auth configurées pour la PWA de production et le développement local.
- [x] CORS vérifié : origine autorisée en 204, requête sans session en 401 et origine inconnue en 403.
- [x] Validation locale complète réussie : 17 fichiers de tests, 73 tests, lint, typecheck, format, contrôles cloud/PWA et build.
- [x] Validation distante réussie : schéma, RLS, migration et conseillers de sécurité Supabase contrôlés.
- [x] Parcours SaaS ajouté : connexion avant le tableau de bord, onboarding obligatoire de l’espace et du premier Brand Kit, avec mode local explicite.

## 🚧 Validation manuelle

- [ ] Recevoir un lien magique dans une boîte e-mail réelle, créer un espace business et lier un Brand Kit.
- [ ] Fusionner la PR #6 après ce test d’acceptation.

## ⚠️ Points connus

- Les deux avertissements du conseiller Supabase concernent les RPC `create_business_workspace` et `link_brand_kit`. Leur exécution par le rôle `authenticated` est volontaire ; elles vérifient l’identité et les droits côté PostgreSQL, ont un `search_path` vide et refusent `anon`/`public`.
- Les connecteurs OAuth Meta, TikTok et LinkedIn ne font pas partie du Lot 5B.
- La couverture globale est d’environ 39 % ; les parcours critiques du backend et du CORS disposent de contrôles dédiés.

## ⏭️ Prochaine action

Effectuer le test manuel du nouveau parcours depuis `http://127.0.0.1:1420/` : lien magique, création guidée de l’espace et du Brand Kit, puis fusionner la PR #6 si la CI reste verte.
