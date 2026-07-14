import { db } from "../../db/database";
export async function estimateStorage() {
  const estimate = await navigator.storage?.estimate?.();
  const assets = await db.assets.toArray();
  return { usage: estimate?.usage ?? assets.reduce((n, a) => n + a.size, 0), quota: estimate?.quota ?? 0 };
}
export async function findOrphanAssets() {
  const [assets, projects, exports] = await Promise.all([db.assets.toArray(), db.projects.toArray(), db.exports.toArray()]);
  const used = new Set([...projects.flatMap((p) => [p.sourceAssetId, p.thumbnailAssetId]), ...exports.flatMap((e) => [e.thumbnailAssetId, e.exportAssetId])].filter(Boolean));
  return assets.filter((a) => !used.has(a.id));
}
export async function cleanOrphanAssets() {
  const orphaned = await findOrphanAssets();
  await db.assets.bulkDelete(orphaned.map((a) => a.id));
  return orphaned.length;
}
