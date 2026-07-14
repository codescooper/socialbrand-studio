import Dexie, { type EntityTable } from "dexie";
import type { AppSettingRecord, AssetRecord, BatchHistoryRecord, BrandKitRecord, ExportRecord, ProjectRecord } from "../types/persistence";

export class SocialBrandDatabase extends Dexie {
  brandKits!: EntityTable<BrandKitRecord, "id">;
  projects!: EntityTable<ProjectRecord, "id">;
  exports!: EntityTable<ExportRecord, "id">;
  batches!: EntityTable<BatchHistoryRecord, "id">;
  settings!: EntityTable<AppSettingRecord, "key">;
  assets!: EntityTable<AssetRecord, "id">;
  constructor(name = "socialbrand-studio") {
    super(name);
    this.version(1).stores({
      brandKits: "id, name, updatedAt",
      projects: "id, name, brandKitId, updatedAt, lastOpenedAt",
      exports: "id, projectId, batchJobId, status, exportedAt, filename",
      batches: "id, finishedAt, cancelled",
      settings: "key, updatedAt",
      assets: "id, type, lastUsedAt",
    });
  }
}
export const db = new SocialBrandDatabase();
