import { readFile } from "node:fs/promises";
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const settings = await readFile(new URL("../src/services/appSettings.ts", import.meta.url), "utf8");
const appVersion = settings.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const expected = packageJson.version;
if (!expected || manifest.version !== expected || appVersion !== expected) {
  console.error(`Versions incohérentes : package=${expected}, manifest=${manifest.version}, application=${appVersion}`);
  process.exit(1);
}
console.log(`Versions cohérentes : ${expected}`);
