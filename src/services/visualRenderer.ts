import type { BrandKit } from "../types/brandKit";

export type ExportType = "png" | "jpg";
export type ImagePlacement = { x: number; y: number; width: number; height: number };
export const getExportMimeType = (type: ExportType) => type === "jpg" ? "image/jpeg" : "image/png";

export const computeImagePlacement = (sourceWidth: number, sourceHeight: number, outputWidth: number, outputHeight: number, fit: "cover" | "contain", zoom: number, xPercent: number, yPercent: number): ImagePlacement => {
  const fitScale = fit === "cover" ? Math.max(outputWidth / sourceWidth, outputHeight / sourceHeight) : Math.min(outputWidth / sourceWidth, outputHeight / sourceHeight);
  const width = sourceWidth * fitScale * zoom;
  const height = sourceHeight * fitScale * zoom;
  return { x: (outputWidth - width) / 2 + outputWidth * xPercent / 100, y: (outputHeight - height) / 2 + outputHeight * yPercent / 100, width, height };
};

const decodeDataImage = async (source: string) => {
  const image = new Image(); image.src = source; await image.decode(); return image;
};

export const renderVisualBlob = async (image: HTMLImageElement, brandKit: BrandKit, type: ExportType, quality = 0.9, onLogoError?: () => void): Promise<Blob> => {
  const t = brandKit.template;
  const canvas = document.createElement("canvas"); canvas.width = t.outputWidth; canvas.height = t.outputHeight;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("canvas-context");
  ctx.fillStyle = brandKit.secondaryColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const placement = computeImagePlacement(image.naturalWidth, image.naturalHeight, canvas.width, canvas.height, t.imageFit, t.imageZoom, t.imageX, t.imageY);
  ctx.drawImage(image, placement.x, placement.y, placement.width, placement.height);
  const footer = canvas.height * t.footerHeight / 100;
  ctx.fillStyle = brandKit.primaryColor; ctx.fillRect(0, canvas.height - footer, canvas.width, footer);
  ctx.fillStyle = brandKit.textColor; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = `700 ${canvas.width * t.nameSize / 100}px Arial`; ctx.fillText(brandKit.brandName, canvas.width * t.nameX / 100, canvas.height * t.nameY / 100);
  if (t.showContact) { ctx.textAlign = "right"; ctx.font = `500 ${canvas.width * t.contactSize / 100}px Arial`; ctx.fillText(`${brandKit.contact} • ${brandKit.website}`, canvas.width * t.contactX / 100, canvas.height * t.contactY / 100); }
  if (brandKit.logo && t.showLogo) {
    try { const logo = await decodeDataImage(brandKit.logo); const width = canvas.width * t.logoSize / 100; const height = logo.height / logo.width * width; ctx.drawImage(logo, canvas.width * t.logoX / 100, canvas.height * t.logoY / 100 - height / 2, width, height); }
    catch { onLogoError?.(); }
  }
  const mime = getExportMimeType(type);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("blob-creation")), mime, type === "jpg" ? quality : undefined));
};
