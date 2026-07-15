import "fake-indexeddb/auto";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./database";
import { initializePersistence } from "./migrations";
import { DEFAULT_BRAND_KIT } from "../constants/brandKitDefaults";
import { brandKitRepository } from "./repositories";
import { duplicateProject, saveProject } from "../features/projects/projectService";
import { cleanOrphanAssets, findOrphanAssets } from "../features/storage/storageService";
import { exportBackup, importBackup, parseBackup } from "../features/backup/backupService";
import { socialAccountRepository } from "./repositories/socialAccountRepository";
import { socialMetricRepository } from "./repositories/socialMetricRepository";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
beforeEach(async () => {
  await db.delete();
  await db.open();
});
afterEach(async () => {
  await db.delete();
});

describe("persistance locale", () => {
  it("migre un Brand Kit valide une seule fois", async () => {
    const storage = new MemoryStorage();
    storage.setItem("sbs-brand-kits", JSON.stringify([DEFAULT_BRAND_KIT]));
    const first = await initializePersistence(storage);
    const second = await initializePersistence(storage);
    expect(first.migrated).toBe(1);
    expect(second.migrated).toBe(0);
    expect(await db.brandKits.count()).toBe(1);
  });
  it("répare une ancienne valeur compatible et rejette les données corrompues", async () => {
    const storage = new MemoryStorage();
    storage.setItem("sbs-brand-kits", JSON.stringify([{ ...DEFAULT_BRAND_KIT, primaryColor: "incorrect" }, null]));
    const report = await initializePersistence(storage);
    expect(report.repaired).toBe(1);
    expect(report.ignored).toBe(1);
    expect((await db.brandKits.toArray())[0].content.primaryColor).toMatch(/^#/);
  });
  it("crée, met à jour et supprime via le repository", async () => {
    const now = new Date().toISOString();
    const item = { id: "kit-test", version: 1 as const, name: "Test", content: { ...DEFAULT_BRAND_KIT, id: "kit-test" }, createdAt: now, updatedAt: now };
    await brandKitRepository.create(item);
    expect((await brandKitRepository.getById(item.id))?.name).toBe("Test");
    await brandKitRepository.update({ ...item, name: "Modifié" });
    expect((await brandKitRepository.list())[0].name).toBe("Modifié");
    await brandKitRepository.delete(item.id);
    expect(await brandKitRepository.count()).toBe(0);
  });
  it("sauvegarde et duplique un projet avec sa ressource", async () => {
    await initializePersistence(new MemoryStorage());
    const file = new File(["image"], "photo.png", { type: "image/png" });
    const id = await saveProject({ name: "Campagne", brandKit: DEFAULT_BRAND_KIT, socialFormat: "instagram_post", exportFormat: "png", jpgQuality: 0.9, image: file });
    const project = await db.projects.get(id);
    expect(project?.sourceAssetId).toBeTruthy();
    const copy = await duplicateProject(project!);
    expect(copy.id).not.toBe(id);
    expect(copy.sourceAssetId).toBe(project?.sourceAssetId);
  });
  it("détecte et nettoie uniquement les ressources orphelines", async () => {
    const now = new Date().toISOString();
    await db.assets.add({ id: "orphan", type: "source", name: "x", blob: new Blob(["x"]), size: 1, mimeType: "text/plain", createdAt: now, lastUsedAt: now });
    expect(await findOrphanAssets()).toHaveLength(1);
    expect(await cleanOrphanAssets()).toBe(1);
    expect(await db.assets.count()).toBe(0);
  });
  it("refuse une sauvegarde corrompue sans modifier la base", async () => {
    await initializePersistence(new MemoryStorage());
    const before = await db.brandKits.count();
    await expect(parseBackup(new File(["not-a-zip"], "backup.zip", { type: "application/zip" }))).rejects.toThrow(/corrompue|incomplète/);
    expect(await db.brandKits.count()).toBe(before);
  });
  it("génère un manifeste et restaure les relations en fusion", async () => {
    await initializePersistence(new MemoryStorage());
    const now = new Date().toISOString();
    const projectId = "project-backup";
    await db.projects.add({
      id: projectId,
      version: 1,
      name: "À restaurer",
      brandKitId: DEFAULT_BRAND_KIT.id,
      renderSettings: DEFAULT_BRAND_KIT.template,
      socialFormat: "instagram_post",
      exportFormat: "png",
      jpgQuality: 0.9,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    });
    await db.exports.add({
      id: "export-1",
      projectId,
      filename: "visuel.png",
      brandKitId: DEFAULT_BRAND_KIT.id,
      brandKitName: DEFAULT_BRAND_KIT.brandName,
      socialFormat: "instagram_post",
      width: 1080,
      height: 1080,
      format: "png",
      size: 10,
      status: "success",
      exportedAt: now,
    });
    await socialAccountRepository.create({
      id: "social-backup",
      version: 1,
      brandKitId: DEFAULT_BRAND_KIT.id,
      platform: "facebook",
      displayName: "Page sauvegardée",
      connectionMode: "manual",
      connectionStatus: "manual",
      grantedScopes: [],
      createdAt: now,
      updatedAt: now,
    });
    await socialMetricRepository.create({
      id: "social-metric-backup",
      version: 1,
      socialAccountId: "social-backup",
      capturedAt: now,
      metrics: { followers: 0 },
      sourceMetrics: {},
      source: "api",
    });
    const backup = new File([await exportBackup()], "backup.zip", { type: "application/zip" });
    const parsed = await parseBackup(backup);
    expect(parsed.manifest.counts.projects).toBe(1);
    expect(parsed.manifest.counts.socialAccounts).toBe(1);
    expect(parsed.data.socialMetricSnapshots[0].metrics.followers).toBe(0);
    const result = await importBackup(backup, "merge");
    expect(result.remapped).toBeGreaterThan(0);
    expect(await db.projects.count()).toBe(2);
    const restoredExports = await db.exports.toArray();
    expect(restoredExports.every((item) => item.projectId && restoredExports.length === 2)).toBe(true);
    expect(await db.socialAccounts.count()).toBe(1);
    expect(await db.socialMetricSnapshots.count()).toBe(2);
    expect((await db.socialMetricSnapshots.toArray()).every((item) => item.socialAccountId === "social-backup")).toBe(true);
  });
  it("restaure une ancienne sauvegarde sans tables sociales", async () => {
    const zip = new JSZip();
    zip.file(
      "manifest.json",
      JSON.stringify({
        format: "socialbrand-backup",
        formatVersion: 1,
        createdAt: new Date().toISOString(),
        appVersion: "0.2.0",
        counts: { brandKits: 0, projects: 0, exports: 0, batches: 0, settings: 0, assets: 0 },
        estimatedSize: 0,
        includesAssets: false,
      }),
    );
    for (const path of ["data/brand-kits.json", "data/projects.json", "data/exports.json", "data/batches.json", "data/settings.json", "data/assets.json"]) zip.file(path, "[]");
    const file = new File([await zip.generateAsync({ type: "blob" })], "backup-0.2.0.zip", { type: "application/zip" });
    const parsed = await parseBackup(file);
    expect(parsed.data.socialAccounts).toEqual([]);
    expect(parsed.data.socialMetricSnapshots).toEqual([]);
    await expect(importBackup(file, "merge")).resolves.toBeTruthy();
  });
});
