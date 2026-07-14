import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND_KIT } from "../../constants/brandKitDefaults";
import { calculateBatchProgress, canTransitionBatchStatus, processBatch } from "./batchProcessor";
import type { BatchFile, BatchSettings } from "./batchTypes";

const file = (name: string): BatchFile => {
  const source = { name, size: 10, type: "image/png", lastModified: 1 } as File;
  return { id: name, file: source, name, size: 10, type: "image/png", status: "ready", progress: 0 };
};
const settings: BatchSettings = { brandKit: DEFAULT_BRAND_KIT, socialFormatKey: "instagram_post", outputType: "png", jpgQuality: 0.9 };

describe("batch processor", () => {
  it("valide les transitions de statut", () => {
    expect(canTransitionBatchStatus("ready", "processing")).toBe(true);
    expect(canTransitionBatchStatus("completed", "processing")).toBe(false);
  });
  it("calcule une progression réelle", () => {
    const files = [
      { ...file("a"), status: "completed" as const },
      { ...file("b"), status: "failed" as const },
      { ...file("c"), status: "processing" as const },
    ];
    expect(calculateBatchProgress(files)).toMatchObject({ total: 3, finished: 2, completed: 1, failed: 1, percent: 67 });
  });
  it("poursuit après l’échec d’un fichier", async () => {
    const result = await processBatch(
      [file("ok-1"), file("bad"), file("ok-2")],
      settings,
      async (source) => {
        if (source.name === "bad") throw new Error("cassé");
        return new Blob([source.name]);
      },
      () => undefined,
      new AbortController().signal,
      2,
    );
    expect(result.filter((item) => item.status === "completed")).toHaveLength(2);
    expect(result.find((item) => item.name === "bad")?.status).toBe("failed");
  });
  it("respecte la limite de concurrence", async () => {
    let running = 0,
      maximum = 0;
    await processBatch(
      [file("1"), file("2"), file("3"), file("4")],
      settings,
      async () => {
        running++;
        maximum = Math.max(maximum, running);
        await new Promise((resolve) => setTimeout(resolve, 10));
        running--;
        return new Blob(["ok"]);
      },
      () => undefined,
      new AbortController().signal,
      2,
    );
    expect(maximum).toBe(2);
  });
  it("annule la file sans perdre les réussites", async () => {
    const controller = new AbortController();
    let rendered = 0;
    const result = await processBatch(
      [file("1"), file("2"), file("3")],
      settings,
      async (_source, _settings, signal) => {
        rendered++;
        if (rendered === 1) return new Blob(["ok"]);
        controller.abort();
        if (signal.aborted) throw new DOMException("stop", "AbortError");
        return new Blob();
      },
      () => undefined,
      controller.signal,
      1,
    );
    expect(result.some((item) => item.status === "completed")).toBe(true);
    expect(result.some((item) => item.status === "cancelled")).toBe(true);
  });
});
