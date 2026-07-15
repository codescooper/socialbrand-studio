import Dexie, { type EntityTable } from "dexie";
import type { AppSettingRecord, AssetRecord, BatchHistoryRecord, BrandKitRecord, ExportRecord, ProjectRecord } from "../types/persistence";
import type { SocialAccountRecord, SocialMetricSnapshotRecord, SocialPostMetricSnapshotRecord, SocialPostRecord } from "../types/social";

export class SocialBrandDatabase extends Dexie {
  brandKits!: EntityTable<BrandKitRecord, "id">;
  projects!: EntityTable<ProjectRecord, "id">;
  exports!: EntityTable<ExportRecord, "id">;
  batches!: EntityTable<BatchHistoryRecord, "id">;
  settings!: EntityTable<AppSettingRecord, "key">;
  assets!: EntityTable<AssetRecord, "id">;
  socialAccounts!: EntityTable<SocialAccountRecord, "id">;
  socialMetricSnapshots!: EntityTable<SocialMetricSnapshotRecord, "id">;
  socialPosts!: EntityTable<SocialPostRecord, "id">;
  socialPostMetricSnapshots!: EntityTable<SocialPostMetricSnapshotRecord, "id">;
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
    this.version(2).stores({
      brandKits: "id, name, updatedAt",
      projects: "id, name, brandKitId, updatedAt, lastOpenedAt",
      exports: "id, projectId, batchJobId, status, exportedAt, filename",
      batches: "id, finishedAt, cancelled",
      settings: "key, updatedAt",
      assets: "id, type, lastUsedAt",
      socialAccounts: "id, brandKitId, platform, &[brandKitId+platform], updatedAt, lastSyncedAt",
      socialMetricSnapshots: "id, socialAccountId, capturedAt, periodStart, periodEnd, [socialAccountId+capturedAt]",
      socialPosts: "id, socialAccountId, externalPostId, platform, publishedAt, fetchedAt, &[socialAccountId+externalPostId]",
      socialPostMetricSnapshots: "id, socialPostId, capturedAt, [socialPostId+capturedAt]",
    });
  }
}
export const db = new SocialBrandDatabase();
