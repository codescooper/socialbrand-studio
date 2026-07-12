import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND_KIT, TEMPLATE_LIMITS } from "../constants/brandKitDefaults";
import { loadAndRepairBrandKits, normalizeBrandKit, validateBrandKitImport } from "./brandKitValidation";

describe("Brand Kit validation", () => {
  it("accepte un Brand Kit valide", () => {
    const result = validateBrandKitImport(DEFAULT_BRAND_KIT);
    expect(result).not.toBeNull();
    expect(result?.brandKit.brandName).toBe("Ma marque");
    expect(result?.repaired).toBe(false);
  });

  it("rejette un JSON sans structure de Brand Kit", () => {
    expect(validateBrandKitImport({ hello: "world" })).toBeNull();
    expect(validateBrandKitImport([])).toBeNull();
    expect(validateBrandKitImport(null)).toBeNull();
  });

  it("normalise une ancienne structure compatible", () => {
    const result = validateBrandKitImport({ name: "Ancienne marque", colors: { primary: "#123456" }, phone: "+225 01 02 03 04 05", template: {} });
    expect(result?.brandKit.brandName).toBe("Ancienne marque");
    expect(result?.brandKit.primaryColor).toBe("#123456");
    expect(result?.brandKit.contact).toBe("+225 01 02 03 04 05");
    expect(result?.repaired).toBe(true);
  });

  it("répare les couleurs incorrectes", () => {
    const result = normalizeBrandKit({ ...DEFAULT_BRAND_KIT, primaryColor: "red", secondaryColor: "#abc" });
    expect(result.brandKit.primaryColor).toBe(DEFAULT_BRAND_KIT.primaryColor);
    expect(result.brandKit.secondaryColor).toBe(DEFAULT_BRAND_KIT.secondaryColor);
    expect(result.repairs).toContain("primaryColor");
  });

  it("borne dimensions, positions et zoom", () => {
    const result = normalizeBrandKit({ ...DEFAULT_BRAND_KIT, template: { ...DEFAULT_BRAND_KIT.template, outputWidth: 10, outputHeight: 99999, imageZoom: 30, imageX: -999, logoSize: Number.NaN } });
    expect(result.brandKit.template.outputWidth).toBe(TEMPLATE_LIMITS.dimension.min);
    expect(result.brandKit.template.outputHeight).toBe(TEMPLATE_LIMITS.dimension.max);
    expect(result.brandKit.template.imageZoom).toBe(TEMPLATE_LIMITS.imageZoom.max);
    expect(result.brandKit.template.imageX).toBe(TEMPLATE_LIMITS.imagePosition.min);
    expect(result.brandKit.template.logoSize).toBe(DEFAULT_BRAND_KIT.template.logoSize);
  });

  it("répare un stockage local corrompu", () => {
    const result = loadAndRepairBrandKits("not-json");
    expect(result.repaired).toBe(true);
    expect(result.kits).toHaveLength(1);
  });
});
