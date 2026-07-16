# Backend sécurisé — Lot 5B

## Choix d’architecture

Le backend retenu est Supabase : Auth pour les sessions, PostgreSQL pour les données cloud, Row Level Security pour l’isolation multi-business et Edge Functions pour les opérations serveur. La PWA reste utilisable sans configuration cloud.

Versions validées le 15 juillet 2026 :

- `@supabase/supabase-js` 2.110.5 ;
- Supabase CLI 2.109.1 ;
- PostgreSQL local 17 selon `supabase/config.toml`.

## Données cloud

- `profiles` : profil minimal lié à `auth.users` ;
- `business_workspaces` : espaces business ;
- `business_memberships` : rôles `owner`, `admin`, `editor`, `viewer` ;
- `brand_kit_links` : relation entre un Brand Kit local et un espace ;
- `social_connections` : métadonnées non sensibles des futures connexions ;
- `social_credentials` : ciphertext AES-GCM, IV et version de clé, jamais lisibles par le frontend ;
- `oauth_states` : hash des futurs états OAuth, expiration et consommation ;
- `social_sync_jobs` : état des futures synchronisations ;
- `security_audit_events` : événements techniques sans secret.

Toutes les tables du schéma public ont RLS activée. Les colonnes utilisées par les politiques et clés étrangères sont indexées. `social_credentials`, `oauth_states` et `security_audit_events` n’accordent aucun accès aux rôles `anon` ou `authenticated`.

## Authentification

Le premier parcours utilise un lien magique envoyé par Supabase Auth. Aucun mot de passe n’est collecté par SocialBrand Studio. La session Supabase est distincte des futurs credentials sociaux.

## Variables

Frontend public :

- `VITE_SUPABASE_URL` ;
- `VITE_SUPABASE_PUBLISHABLE_KEY`.

Edge Functions uniquement :

- `SOCIAL_TOKEN_ENCRYPTION_KEY` : clé AES de 32 octets encodée en base64 ;
- `SOCIAL_TOKEN_KEY_VERSION` ;
- `ALLOWED_ORIGINS` : origines HTTP exactes séparées par des virgules, sans chemin ; par exemple `https://codescooper.github.io`.

Ne jamais placer une clé `service_role`, un secret de fournisseur ou la clé de chiffrement dans une variable `VITE_*`.

## Environnements

Créer trois projets Supabase séparés : développement, préproduction et production. Ne jamais réutiliser les clés de chiffrement ou les credentials fournisseurs entre environnements. Les URL GitHub Pages doivent être ajoutées explicitement aux URL Auth ; leur origine, sans chemin, doit être ajoutée à `ALLOWED_ORIGINS`.

## Installation locale

1. Copier `.env.example` vers `.env.local` et renseigner uniquement les valeurs publiques locales.
2. Lancer `npx supabase start`.
3. Appliquer les migrations avec `npx supabase db reset`.
4. Lancer la fonction avec `npx supabase functions serve business-workspaces --env-file .env.local`.
5. Exécuter `npm run dev`.

## Déploiement

1. Créer ou sélectionner le projet Supabase de l’environnement.
2. Exécuter `npx supabase link --project-ref <ref>`.
3. Contrôler les migrations avec `npx supabase db push --dry-run`, puis les appliquer.
4. Définir les secrets Edge Functions avec `npx supabase secrets set --env-file <fichier-non-versionné>` ; `ALLOWED_ORIGINS` doit contenir les origines réelles du navigateur, sans chemin.
5. Déployer `business-workspaces`.
6. Configurer les deux variables publiques dans le build PWA.

## Validation du déploiement

- `npm run cloud:check` contrôle les neuf tables, leur RLS et l’absence de secrets serveur dans le frontend.
- Une requête CORS `OPTIONS` depuis une origine autorisée doit répondre en 204 sans corps ; une origine inconnue doit être refusée en 403.
- Les RPC `create_business_workspace` et `link_brand_kit` sont volontairement exécutables par `authenticated`. Elles valident `auth.uid()` et les rôles, utilisent un `search_path` vide et ne sont pas accordées à `anon` ou `public`.
- Le test d’acceptation final utilise une adresse e-mail réelle : lien magique, création d’un espace, puis liaison d’un Brand Kit.

## Limites du Lot 5B

Le Lot 5B ne connecte encore aucun réseau social. Les contrats OAuth et le chiffrement sont préparés, mais aucun jeton Meta, TikTok ou LinkedIn n’est accepté tant qu’un connecteur serveur audité n’est pas ajouté.
