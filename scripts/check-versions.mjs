import { readFile } from "node:fs/promises";
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const tauri = JSON.parse(await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const cargo = await readFile(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const expected = packageJson.version;
if (!expected || tauri.version !== expected || cargoVersion !== expected) {
  console.error(`Versions incohérentes : package=${expected}, tauri=${tauri.version}, cargo=${cargoVersion}`);
  process.exit(1);
}
console.log(`Versions cohérentes : ${expected}`);
