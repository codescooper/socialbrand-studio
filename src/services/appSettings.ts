import { db } from "../db/database";
import type { ExportType } from "./visualRenderer";

export const APP_VERSION = "0.1.0";
export type AppPreferences = { defaultExportFormat: ExportType; defaultJpgQuality: number; batchConcurrency: 1 | 2 | 3 };
export const DEFAULT_PREFERENCES: AppPreferences = { defaultExportFormat: "png", defaultJpgQuality: 0.9, batchConcurrency: 2 };

export function normalizePreferences(value: unknown): AppPreferences {
  const input = value && typeof value === "object" ? (value as Partial<AppPreferences>) : {};
  return {
    defaultExportFormat: input.defaultExportFormat === "jpg" ? "jpg" : "png",
    defaultJpgQuality:
      typeof input.defaultJpgQuality === "number" && input.defaultJpgQuality >= 0.5 && input.defaultJpgQuality <= 1
        ? input.defaultJpgQuality
        : DEFAULT_PREFERENCES.defaultJpgQuality,
    batchConcurrency: input.batchConcurrency === 1 || input.batchConcurrency === 3 ? input.batchConcurrency : 2,
  };
}
export async function loadPreferences() {
  return normalizePreferences((await db.settings.get("preferences"))?.value);
}
export async function savePreferences(value: AppPreferences) {
  const normalized = normalizePreferences(value);
  await db.settings.put({ key: "preferences", value: normalized, updatedAt: new Date().toISOString() });
  return normalized;
}
export async function isOnboardingComplete() {
  return (await db.settings.get("onboarding-completed"))?.value === true;
}
export async function setOnboardingComplete(value: boolean) {
  await db.settings.put({ key: "onboarding-completed", value, updatedAt: new Date().toISOString() });
}
