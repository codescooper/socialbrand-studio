import type { BrandKit } from "./brandKit";
import type { ExportType } from "../services/visualRenderer";

export const CONTENT_VERSION = 1;
export type PersistedStatus = "success" | "failed" | "cancelled";
export type BrandKitRecord = { id: string; version: 1; name: string; content: BrandKit; createdAt: string; updatedAt: string };
export type AssetRecord = { id: string; type: "source" | "thumbnail" | "export"; name: string; blob: Blob; size: number; mimeType: string; createdAt: string; lastUsedAt: string };
export type ProjectRecord = { id: string; version: 1; name: string; brandKitId: string; renderSettings: BrandKit["template"]; socialFormat: string; exportFormat: ExportType; jpgQuality: number; sourceAssetId?: string; thumbnailAssetId?: string; createdAt: string; updatedAt: string; lastOpenedAt: string };
export type ExportRecord = { id: string; projectId?: string; batchJobId?: string; filename: string; brandKitId: string; brandKitName: string; socialFormat: string; width: number; height: number; format: ExportType; size: number; status: PersistedStatus; thumbnailAssetId?: string; exportAssetId?: string; exportedAt: string; errorMessage?: string };
export type BatchHistoryRecord = { id: string; parameters: { brandKitId: string; brandKitName: string; socialFormat: string; format: ExportType; jpgQuality: number }; total: number; successes: number; failures: number; rejected: number; cancelled: boolean; zipName?: string; startedAt: string; finishedAt: string; errors: string[] };
export type AppSettingRecord = { key: string; value: unknown; updatedAt: string };
export type BackupData = { brandKits: BrandKitRecord[]; projects: ProjectRecord[]; exports: ExportRecord[]; batches: BatchHistoryRecord[]; settings: AppSettingRecord[]; assets: AssetRecord[] };
export type BackupManifest = { format: "socialbrand-backup"; formatVersion: 1; createdAt: string; appVersion: string; counts: Record<keyof BackupData, number>; estimatedSize: number; includesAssets: boolean };
