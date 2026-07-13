import { describe, expect, it } from "vitest";
import { computeImagePlacement, getExportMimeType } from "./visualRenderer";

describe("visual renderer geometry", () => {
  it("calcule un cadrage cover centré", () => {
    expect(computeImagePlacement(800, 1200, 1080, 1080, "cover", 1, 0, 0)).toEqual({ x: 0, y: -270, width: 1080, height: 1620 });
  });

  it("applique zoom et déplacement avec les mêmes coordonnées normalisées que l’aperçu", () => {
    const placement = computeImagePlacement(1000, 1000, 1080, 1920, "cover", 1.5, 10, -5);
    expect(placement.width).toBe(2880);
    expect(placement.height).toBe(2880);
    expect(placement.x).toBe(-792);
    expect(placement.y).toBe(-576);
  });

  it("sélectionne le bon type MIME pour PNG et JPG", () => {
    expect(getExportMimeType("png")).toBe("image/png");
    expect(getExportMimeType("jpg")).toBe("image/jpeg");
  });
});
