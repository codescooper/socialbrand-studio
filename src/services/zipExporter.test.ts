import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND_KIT } from "../constants/brandKitDefaults";
import type { BatchFile, BatchSettings } from "../features/batch/batchTypes";
import { buildBatchReport, createBatchZip, uniqueOutputNames } from "./zipExporter";

const make = (name: string, status: BatchFile["status"], blob?: Blob, error?: string): BatchFile => {
  const file = { name, size: 10, type: "image/png", lastModified: 1 } as File;
  return { id: `${name}-${status}`, file, name, size: 10, type: "image/png", status, progress: 100, blob, error };
};
const settings: BatchSettings = { brandKit: DEFAULT_BRAND_KIT, socialFormatKey: "instagram_post", outputType: "png", jpgQuality: 0.9 };

describe("ZIP exporter", () => {
  it("génère des noms uniques déterministes", () => {
    expect(uniqueOutputNames([make("photo.png", "completed"), make("photo.jpg", "completed")], "png")).toEqual(["photo.png", "photo-2.png"]);
  });
  it("inclut les informations du rapport", () => {
    const report = JSON.parse(buildBatchReport([make("ok.png", "completed"), make("bad.png", "failed", undefined, "Canvas")], settings, new Date("2026-07-12T12:00:00Z")));
    expect(report.brandKit).toBe("Ma marque");
    expect(report.completed).toEqual(["ok.png"]);
    expect(report.failed[0].reason).toBe("Canvas");
  });
  it("refuse un ZIP vide", async () => {
    await expect(createBatchZip([make("bad.png", "failed")], settings)).rejects.toThrow("Aucun visuel");
  });
  it("inclut uniquement les réussites et le rapport", async () => {
    const blob = await createBatchZip([make("ok.png", "completed", new Blob(["ok"])), make("bad.png", "failed", undefined, "erreur")], settings);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const entries = Object.keys(zip.files);
    expect(entries).toContain("ok.png");
    expect(entries).toContain("rapport-traitement.json");
    expect(entries.some((name) => name.includes("bad"))).toBe(false);
    expect(entries).toHaveLength(2);
  });
});
