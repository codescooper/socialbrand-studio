import type { BrandKit } from "../../types/brandKit";
import type { ExportType } from "../../services/visualRenderer";

export type BatchFileStatus = "validating" | "ready" | "processing" | "completed" | "failed" | "rejected" | "cancelled";

export type BatchFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: BatchFileStatus;
  progress: number;
  width?: number;
  height?: number;
  blob?: Blob;
  outputName?: string;
  error?: string;
};

export type BatchSettings = {
  brandKit: BrandKit;
  socialFormatKey: string;
  outputType: ExportType;
  jpgQuality: number;
};

export type BatchProgress = {
  total: number;
  finished: number;
  completed: number;
  failed: number;
  rejected: number;
  cancelled: number;
  percent: number;
  currentNames: string[];
};

export type BatchJobStatus = "idle" | "running" | "completed" | "cancelled";
