import { describe, expect, it } from "vitest";
import { MAX_BATCH_FILES, MAX_BATCH_TOTAL_SIZE, fileFingerprint, selectNewBatchFiles } from "./batchValidation";
import type { BatchFile } from "./batchTypes";

const fakeFile = (name: string, size = 1024, type = "image/png", lastModified = 1) => ({ name, size, type, lastModified }) as File;
const item = (file: File, id = file.name): BatchFile => ({ id, file, name: file.name, size: file.size, type: file.type, status: "ready", progress: 0 });

describe("batch validation", () => {
  it("limite le lot à 50 fichiers", () => {
    const existing = Array.from({ length: MAX_BATCH_FILES }, (_, index) => item(fakeFile(`${index}.png`, 10, "image/png", index), String(index)));
    const result = selectNewBatchFiles(existing, [fakeFile("extra.png")]);
    expect(result.accepted).toHaveLength(0); expect(result.rejected[0].reason).toContain("50");
  });
  it("applique la limite de 25 Mo par fichier", () => {
    const result = selectNewBatchFiles([], [fakeFile("large.jpg", 25 * 1024 * 1024 + 1, "image/jpeg")]);
    expect(result.rejected[0].reason).toContain("25 Mo");
  });
  it("applique la limite totale de 200 Mo", () => {
    const existing = Array.from({ length: 8 }, (_, index) => item(fakeFile(`${index}.png`, 24 * 1024 * 1024, "image/png", index)));
    const result = selectNewBatchFiles(existing, [fakeFile("overflow.png", 10 * 1024 * 1024)]);
    expect(existing.reduce((sum, file) => sum + file.size, 0)).toBeLessThan(MAX_BATCH_TOTAL_SIZE);
    expect(result.rejected[0].reason).toContain("200 Mo");
  });
  it("accepte les formats autorisés et rejette les autres", () => {
    const result = selectNewBatchFiles([], [fakeFile("a.png", 10, "image/png", 1), fakeFile("b.jpg", 10, "image/jpeg", 2), fakeFile("c.webp", 10, "image/webp", 3), fakeFile("d.avif", 10, "image/avif", 4), fakeFile("e.gif", 10, "image/gif", 5)]);
    expect(result.accepted).toHaveLength(4); expect(result.rejected).toHaveLength(1);
  });
  it("détecte les doublons par nom, taille et date", () => {
    const file = fakeFile("same.png", 42, "image/png", 123);
    expect(fileFingerprint(file)).toBe(fileFingerprint(file));
    const result = selectNewBatchFiles([item(file)], [fakeFile("same.png", 42, "image/png", 123)]);
    expect(result.rejected[0].reason).toContain("Doublon");
  });
});
