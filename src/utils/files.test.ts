import { describe, expect, it } from "vitest";
import { buildExportFilename, safeFilename, validateImageFile } from "./files";

describe("file utilities", () => {
  it("génère un nom de fichier sûr", () => {
    expect(safeFilename('Ma Marque: Côte d\'Ivoire / Test')).toBe("ma-marque-cote-d-ivoire-test");
    expect(buildExportFilename("Ma Marque", "Instagram — Post", "jpg", new Date("2026-07-12T10:00:00Z"))).toBe("ma-marque-instagram-post-2026-07-12.jpg");
  });

  it("sélectionne correctement PNG ou JPG dans le nom", () => {
    expect(buildExportFilename("Brand", "1080x1080", "png", new Date("2026-01-02"))).toMatch(/\.png$/);
    expect(buildExportFilename("Brand", "1080x1080", "jpg", new Date("2026-01-02"))).toMatch(/\.jpg$/);
  });

  it("refuse un format non supporté ou trop volumineux", () => {
    expect(validateImageFile(new File(["x"], "test.gif", { type: "image/gif" }))).toBe("unsupported");
    expect(validateImageFile(new File([new Uint8Array(25 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))).toBe("too-large");
  });
});
