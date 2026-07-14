import { db } from "../../db/database";
import { storageError } from "../../db/errors";
import type { BrandKit } from "../../types/brandKit";
import type { ExportType } from "../../services/visualRenderer";
import type { ProjectRecord } from "../../types/persistence";
export async function saveProject(input: { id?: string; name: string; brandKit: BrandKit; socialFormat: string; exportFormat: ExportType; jpgQuality: number; image?: File }) {
  const now = new Date().toISOString(); const id = input.id || crypto.randomUUID(); const existing = input.id ? await db.projects.get(input.id) : undefined; let sourceAssetId = existing?.sourceAssetId;
  try { await db.transaction("rw", db.projects, db.assets, async () => { if (input.image) { sourceAssetId = sourceAssetId || crypto.randomUUID(); await db.assets.put({ id: sourceAssetId, type: "source", name: input.image!.name, blob: input.image!, size: input.image!.size, mimeType: input.image!.type, createdAt: existing?.createdAt || now, lastUsedAt: now }); } const project: ProjectRecord = { id, version: 1, name: input.name.trim() || "Projet sans titre", brandKitId: input.brandKit.id, renderSettings: input.brandKit.template, socialFormat: input.socialFormat, exportFormat: input.exportFormat, jpgQuality: input.jpgQuality, sourceAssetId, createdAt: existing?.createdAt || now, updatedAt: now, lastOpenedAt: now }; await db.projects.put(project); }); return id; } catch (e) { throw storageError(e, "le projet"); }
}
export async function duplicateProject(project: ProjectRecord) { const now = new Date().toISOString(); const copy = { ...project, id: crypto.randomUUID(), name: `${project.name} — copie`, createdAt: now, updatedAt: now, lastOpenedAt: now }; await db.projects.add(copy); return copy; }
export async function deleteProject(id: string) { await db.projects.delete(id); }
