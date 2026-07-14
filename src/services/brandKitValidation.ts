import { DEFAULT_BRAND_KIT, TEMPLATE_LIMITS } from "../constants/brandKitDefaults";
import type { BrandKit, BrandKitNormalizationResult, BrandTemplate, ImageFit } from "../types/brandKit";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const safeString = (value: unknown, fallback: string, max = 160) => (typeof value === "string" ? value.trim().slice(0, max) : fallback);
export const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
export const normalizeHexColor = (value: unknown, fallback: string) => (typeof value === "string" && HEX_COLOR.test(value.trim()) ? value.trim().toUpperCase() : fallback);

const normalizeTemplate = (raw: unknown, repairs: string[]): BrandTemplate => {
  const template = isRecord(raw) ? raw : {};
  const number = (key: keyof BrandTemplate, min: number, max: number) => {
    const fallback = DEFAULT_BRAND_KIT.template[key] as number;
    const result = clampNumber(template[key], min, max, fallback);
    if (template[key] !== undefined && result !== Number(template[key])) repairs.push(`template.${key}`);
    return result;
  };
  const fit: ImageFit = template.imageFit === "contain" ? "contain" : "cover";
  if (template.imageFit !== undefined && template.imageFit !== "cover" && template.imageFit !== "contain") repairs.push("template.imageFit");
  return {
    showLogo: typeof template.showLogo === "boolean" ? template.showLogo : DEFAULT_BRAND_KIT.template.showLogo,
    showContact: typeof template.showContact === "boolean" ? template.showContact : DEFAULT_BRAND_KIT.template.showContact,
    footerHeight: number("footerHeight", TEMPLATE_LIMITS.footerHeight.min, TEMPLATE_LIMITS.footerHeight.max),
    outputWidth: Math.round(number("outputWidth", TEMPLATE_LIMITS.dimension.min, TEMPLATE_LIMITS.dimension.max)),
    outputHeight: Math.round(number("outputHeight", TEMPLATE_LIMITS.dimension.min, TEMPLATE_LIMITS.dimension.max)),
    imageFit: fit,
    imageZoom: number("imageZoom", TEMPLATE_LIMITS.imageZoom.min, TEMPLATE_LIMITS.imageZoom.max),
    imageX: number("imageX", TEMPLATE_LIMITS.imagePosition.min, TEMPLATE_LIMITS.imagePosition.max),
    imageY: number("imageY", TEMPLATE_LIMITS.imagePosition.min, TEMPLATE_LIMITS.imagePosition.max),
    logoX: number("logoX", 0, 80),
    logoY: number("logoY", 5, 98),
    logoSize: number("logoSize", TEMPLATE_LIMITS.logoSize.min, TEMPLATE_LIMITS.logoSize.max),
    nameX: number("nameX", 0, 95),
    nameY: number("nameY", 5, 98),
    nameSize: number("nameSize", TEMPLATE_LIMITS.nameSize.min, TEMPLATE_LIMITS.nameSize.max),
    contactX: number("contactX", 20, 100),
    contactY: number("contactY", 5, 98),
    contactSize: number("contactSize", TEMPLATE_LIMITS.contactSize.min, TEMPLATE_LIMITS.contactSize.max),
  };
};

export const normalizeBrandKit = (raw: unknown): BrandKitNormalizationResult => {
  const source = isRecord(raw) ? raw : {};
  const legacyColors = isRecord(source.colors) ? source.colors : {};
  const repairs: string[] = [];
  const color = (key: "primaryColor" | "secondaryColor" | "textColor") => {
    const candidate = source[key] ?? legacyColors[key.replace("Color", "")];
    const result = normalizeHexColor(candidate, DEFAULT_BRAND_KIT[key]);
    if (candidate !== undefined && result !== String(candidate).toUpperCase()) repairs.push(key);
    return result;
  };
  const brandName = safeString(source.brandName ?? source.name, DEFAULT_BRAND_KIT.brandName, 80);
  if (!source.brandName && source.name) repairs.push("brandName");
  const brandKit: BrandKit = {
    id: safeString(source.id, crypto.randomUUID(), 100),
    version: 1,
    brandName,
    primaryColor: color("primaryColor"),
    secondaryColor: color("secondaryColor"),
    textColor: color("textColor"),
    contact: safeString(source.contact ?? source.phone, DEFAULT_BRAND_KIT.contact, 80),
    website: safeString(source.website, DEFAULT_BRAND_KIT.website, 120),
    slogan: safeString(source.slogan, DEFAULT_BRAND_KIT.slogan, 160),
    logo: typeof source.logo === "string" && (source.logo === "" || source.logo.startsWith("data:image/")) ? source.logo : "",
    template: normalizeTemplate(source.template, repairs),
  };
  if (source.logo && !brandKit.logo) repairs.push("logo");
  return { brandKit, repaired: repairs.length > 0 || !isRecord(raw), repairs };
};

export const validateBrandKitImport = (raw: unknown): BrandKitNormalizationResult | null => {
  if (!isRecord(raw)) return null;
  const hasIdentity = typeof raw.brandName === "string" || typeof raw.name === "string";
  const hasBrandData = raw.primaryColor !== undefined || raw.colors !== undefined || raw.template !== undefined;
  if (!hasIdentity || !hasBrandData) return null;
  return normalizeBrandKit(raw);
};

export const loadAndRepairBrandKits = (value: string | null): { kits: BrandKit[]; repaired: boolean } => {
  if (!value) return { kits: [DEFAULT_BRAND_KIT], repaired: false };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) return { kits: [DEFAULT_BRAND_KIT], repaired: true };
    const results = parsed.map(normalizeBrandKit);
    const ids = new Set<string>();
    const kits = results.map(({ brandKit }) => {
      if (ids.has(brandKit.id)) return { ...brandKit, id: crypto.randomUUID() };
      ids.add(brandKit.id);
      return brandKit;
    });
    return { kits, repaired: results.some((result) => result.repaired) || ids.size !== results.length };
  } catch {
    return { kits: [DEFAULT_BRAND_KIT], repaired: true };
  }
};
