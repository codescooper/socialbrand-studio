import JSZip from "jszip";
import type { BatchFile, BatchSettings } from "../features/batch/batchTypes";
import { SOCIAL_FORMATS } from "../constants/socialFormats";
import { safeFilename } from "../utils/files";

export const uniqueOutputNames = (files: BatchFile[], extension: "png" | "jpg") => {
  const used = new Map<string, number>();
  return files.map((file) => {
    const stem = safeFilename(file.name.replace(/\.[^.]+$/, ""));
    const count = (used.get(stem) || 0) + 1;
    used.set(stem, count);
    return `${stem}${count > 1 ? `-${count}` : ""}.${extension}`;
  });
};

export const buildBatchReport = (files: BatchFile[], settings: BatchSettings, date = new Date()) =>
  JSON.stringify(
    {
      generatedAt: date.toISOString(),
      brandKit: settings.brandKit.brandName,
      socialFormat: SOCIAL_FORMATS[settings.socialFormatKey]?.label || settings.socialFormatKey,
      dimensions: { width: settings.brandKit.template.outputWidth, height: settings.brandKit.template.outputHeight },
      output: { type: settings.outputType, jpgQuality: settings.outputType === "jpg" ? settings.jpgQuality : null },
      completed: files.filter((file) => file.status === "completed").map((file) => file.name),
      rejected: files.filter((file) => file.status === "rejected").map((file) => ({ name: file.name, reason: file.error })),
      failed: files.filter((file) => file.status === "failed").map((file) => ({ name: file.name, reason: file.error })),
      cancelled: files.filter((file) => file.status === "cancelled").map((file) => file.name),
    },
    null,
    2,
  );

export async function createBatchZip(files: BatchFile[], settings: BatchSettings, date = new Date()) {
  const completed = files.filter((file) => file.status === "completed" && file.blob);
  if (!completed.length) throw new Error("Aucun visuel réussi à inclure dans le ZIP.");
  const extension = settings.outputType;
  const names = uniqueOutputNames(completed, extension);
  const zip = new JSZip();
  const buffers = await Promise.all(completed.map((file) => file.blob!.arrayBuffer()));
  buffers.forEach((buffer, index) => zip.file(names[index], buffer));
  zip.file("rapport-traitement.json", buildBatchReport(files, settings, date));
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export const batchZipFilename = (settings: BatchSettings, date = new Date()) =>
  `socialbrand-${safeFilename(settings.brandKit.brandName)}-${safeFilename(SOCIAL_FORMATS[settings.socialFormatKey]?.label || settings.socialFormatKey)}-${date.toISOString().slice(0, 10)}.zip`;
