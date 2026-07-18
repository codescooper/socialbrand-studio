import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const migrationDirectory = join(root, "supabase", "migrations");
const migration = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith(".sql"))
  .map((name) => readFileSync(join(migrationDirectory, name), "utf8"))
  .join("\n")
  .toLowerCase();
const requiredTables = [
  "profiles",
  "business_workspaces",
  "business_memberships",
  "brand_kit_links",
  "social_connections",
  "social_credentials",
  "oauth_states",
  "social_sync_jobs",
  "security_audit_events",
];
for (const table of requiredTables) {
  if (!migration.includes(`create table public.${table}`)) throw new Error(`Table cloud manquante : ${table}`);
  if (!migration.includes(`alter table public.${table} enable row level security`)) throw new Error(`RLS manquante : ${table}`);
}
const envExample = readFileSync(join(root, ".env.example"), "utf8");
if (/vite_[a-z0-9_]*(secret|service_role|encryption)/i.test(envExample)) throw new Error("Un secret serveur est préfixé par VITE_.");
const frontendFiles = readdirSync(join(root, "src"), { recursive: true })
  .filter((name) => typeof name === "string" && /\.(ts|tsx)$/.test(name))
  .map((name) => readFileSync(join(root, "src", name), "utf8"))
  .join("\n");
if (/service_role|meta_app_secret|social_token_encryption_key/i.test(frontendFiles)) throw new Error("Un identifiant serveur apparaît dans le frontend.");
console.log(`Fondation cloud valide : ${requiredTables.length} tables protégées par RLS.`);
