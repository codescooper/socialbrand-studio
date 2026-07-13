export const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"] as const;

export type ImageFileError = "unsupported" | "too-large" | "unreadable";

export const validateImageFile = (file: File): ImageFileError | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) return "unsupported";
  if (file.size > MAX_IMAGE_SIZE) return "too-large";
  return null;
};

export const safeFilename = (value: string) => value
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[<>:"'/\\|?*\x00-\x1F]/g, "-")
  .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-")
  .replace(/^[-.]+|[-.]+$/g, "").toLowerCase() || "socialbrand";

export const buildExportFilename = (brand: string, format: string, extension: "png" | "jpg", date = new Date()) => {
  const stamp = date.toISOString().slice(0, 10);
  return `${safeFilename(brand)}-${safeFilename(format)}-${stamp}.${extension}`;
};

export const resetFileInput = (input: HTMLInputElement) => { input.value = ""; };
