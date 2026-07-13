import JSZip from "jszip";
import { db } from "../../db/database";
import { StorageError, storageError } from "../../db/errors";
import type { BackupData, BackupManifest } from "../../types/persistence";

const JSON_FILES: Record<Exclude<keyof BackupData, "assets">, string> = { brandKits: "data/brand-kits.json", projects: "data/projects.json", exports: "data/exports.json", batches: "data/batches.json", settings: "data/settings.json" };
export async function readAllData(): Promise<BackupData> { return { brandKits: await db.brandKits.toArray(), projects: await db.projects.toArray(), exports: await db.exports.toArray(), batches: await db.batches.toArray(), settings: await db.settings.toArray(), assets: await db.assets.toArray() }; }
export async function exportBackup() {
  const data = await readAllData(); const zip = new JSZip();
  for (const [key, path] of Object.entries(JSON_FILES)) zip.file(path, JSON.stringify(data[key as keyof typeof JSON_FILES], null, 2));
  const assetMeta = data.assets.map(({ blob: _blob, ...asset }) => asset); zip.file("data/assets.json", JSON.stringify(assetMeta, null, 2));
  for (const asset of data.assets) zip.file(`assets/${asset.id}`, asset.blob);
  const manifest: BackupManifest = { format: "socialbrand-backup", formatVersion: 1, createdAt: new Date().toISOString(), appVersion: "0.1.0", counts: { brandKits: data.brandKits.length, projects: data.projects.length, exports: data.exports.length, batches: data.batches.length, settings: data.settings.length, assets: data.assets.length }, estimatedSize: data.assets.reduce((n, a) => n + a.size, 0), includesAssets: data.assets.length > 0 };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2)); return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
export async function parseBackup(file: File): Promise<{ manifest: BackupManifest; data: BackupData }> {
  if (!file.name.toLowerCase().endsWith(".zip") || file.size > 500 * 1024 * 1024) throw new StorageError("Sauvegarde invalide ou trop volumineuse. Les données actuelles sont conservées.", "invalid-backup");
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer()); const manifest = JSON.parse(await required(zip, "manifest.json").async("text")) as BackupManifest;
    if (manifest.format !== "socialbrand-backup") throw new StorageError("Cette archive n’est pas une sauvegarde SocialBrand Studio.", "invalid-backup");
    if (manifest.formatVersion !== 1) throw new StorageError("Version de sauvegarde non prise en charge. Utilisez une sauvegarde au format v1.", "unsupported-version");
    const data = {} as BackupData;
    for (const [key, path] of Object.entries(JSON_FILES)) (data as unknown as Record<string, unknown>)[key] = JSON.parse(await required(zip, path).async("text"));
    const meta = JSON.parse(await required(zip, "data/assets.json").async("text")) as Omit<BackupData["assets"][number], "blob">[];
    data.assets = await Promise.all(meta.map(async (asset) => ({ ...asset, blob: await required(zip, `assets/${asset.id}`).async("blob") })));
    if (!Array.isArray(data.brandKits) || !Array.isArray(data.projects) || !Array.isArray(data.exports) || !Array.isArray(data.batches)) throw new Error("shape");
    return { manifest, data };
  } catch (error) { if (error instanceof StorageError) throw error; throw new StorageError("Archive corrompue ou incomplète. Aucune donnée n’a été modifiée.", "invalid-backup", { cause: error }); }
}
function required(zip: JSZip, path: string) { const entry = zip.file(path); if (!entry) throw new Error(`missing:${path}`); return entry; }
export async function importBackup(file: File, mode: "merge" | "replace") {
  const { data } = await parseBackup(file); const remap = new Map<string, string>(); let imported = 0;
  try { await db.transaction("rw", [db.brandKits, db.projects, db.exports, db.batches, db.settings, db.assets], async () => {
    if (mode === "replace") await Promise.all([db.brandKits.clear(), db.projects.clear(), db.exports.clear(), db.batches.clear(), db.settings.clear(), db.assets.clear()]);
    const choose = async (table: { get(id: string): Promise<unknown> }, id: string) => mode === "merge" && await table.get(id) ? crypto.randomUUID() : id;
    for (const item of data.brandKits) { const existing = mode === "merge" ? await db.brandKits.get(item.id) : undefined; if (existing && JSON.stringify(existing.content) === JSON.stringify(item.content)) { remap.set(item.id, existing.id); continue; } const id = await choose(db.brandKits, item.id); remap.set(item.id, id); await db.brandKits.put({ ...item, id, content: { ...item.content, id } }); imported++; }
    for (const item of data.assets) { const existing = mode === "merge" ? await db.assets.get(item.id) : undefined; if (existing && existing.size === item.size && existing.name === item.name) { remap.set(item.id, existing.id); continue; } const id = await choose(db.assets, item.id); remap.set(item.id, id); await db.assets.put({ ...item, id }); imported++; }
    for (const item of data.projects) { const id = await choose(db.projects, item.id); remap.set(item.id, id); await db.projects.put({ ...item, id, brandKitId: remap.get(item.brandKitId) || item.brandKitId, sourceAssetId: item.sourceAssetId && (remap.get(item.sourceAssetId) || item.sourceAssetId), thumbnailAssetId: item.thumbnailAssetId && (remap.get(item.thumbnailAssetId) || item.thumbnailAssetId) }); imported++; }
    for (const item of data.batches) { const id = await choose(db.batches, item.id); remap.set(item.id, id); await db.batches.put({ ...item, id, parameters: { ...item.parameters, brandKitId: remap.get(item.parameters.brandKitId) || item.parameters.brandKitId } }); imported++; }
    for (const item of data.exports) { const id = await choose(db.exports, item.id); await db.exports.put({ ...item, id, projectId: item.projectId && (remap.get(item.projectId) || item.projectId), batchJobId: item.batchJobId && (remap.get(item.batchJobId) || item.batchJobId), brandKitId: remap.get(item.brandKitId) || item.brandKitId, thumbnailAssetId: item.thumbnailAssetId && (remap.get(item.thumbnailAssetId) || item.thumbnailAssetId) }); imported++; }
    for (const item of data.settings) if (mode === "replace" || !await db.settings.get(item.key)) await db.settings.put(item);
  }); } catch (error) { throw storageError(error, "la restauration"); }
  return { imported, remapped: remap.size };
}
