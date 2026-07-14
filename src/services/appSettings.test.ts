import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db/database";
import { DEFAULT_PREFERENCES, isOnboardingComplete, loadPreferences, normalizePreferences, savePreferences, setOnboardingComplete } from "./appSettings";
beforeEach(async () => {
  await db.delete();
  await db.open();
});
afterEach(async () => {
  await db.delete();
});
describe("paramètres bêta", () => {
  it("charge des valeurs sûres par défaut", async () => expect(await loadPreferences()).toEqual(DEFAULT_PREFERENCES));
  it("persiste les préférences valides", async () => {
    await savePreferences({ defaultExportFormat: "jpg", defaultJpgQuality: 0.8, batchConcurrency: 3 });
    expect(await loadPreferences()).toEqual({ defaultExportFormat: "jpg", defaultJpgQuality: 0.8, batchConcurrency: 3 });
  });
  it("répare les valeurs invalides", () => expect(normalizePreferences({ defaultExportFormat: "gif", defaultJpgQuality: 3, batchConcurrency: 8 })).toEqual(DEFAULT_PREFERENCES));
  it("mémorise et réinitialise l’onboarding", async () => {
    expect(await isOnboardingComplete()).toBe(false);
    await setOnboardingComplete(true);
    expect(await isOnboardingComplete()).toBe(true);
    await setOnboardingComplete(false);
    expect(await isOnboardingComplete()).toBe(false);
  });
});
