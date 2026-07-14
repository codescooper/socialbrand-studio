import { access, readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const required = ["name", "short_name", "start_url", "scope", "display", "theme_color", "background_color"];
const missing = required.filter((key) => !manifest[key]);
const hasScalableIcon = manifest.icons?.some((icon) => icon.src && icon.sizes === "any" && icon.type === "image/svg+xml");
const hasRequiredRasterIcons = ["192x192", "512x512"].every((size) => manifest.icons?.some((icon) => icon.src && icon.sizes === size && icon.type === "image/png"));

if (missing.length || manifest.display !== "standalone" || !hasScalableIcon || !hasRequiredRasterIcons) {
  console.error(`Manifeste PWA invalide. Champs manquants : ${missing.join(", ") || "aucun"}`);
  process.exit(1);
}

await Promise.all(manifest.icons.map((icon) => access(new URL(`../public/${icon.src}`, import.meta.url))));
if (!worker.includes("CACHE_NAME") || !worker.includes('request.mode === "navigate"') || !worker.includes("./assets/")) {
  console.error("Le service worker ne couvre pas le cache applicatif et la navigation hors connexion.");
  process.exit(1);
}

console.log(`PWA valide : ${manifest.name} ${manifest.version}`);
