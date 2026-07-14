import { validateImageFile } from "../../utils/files";
import type { BatchFile } from "./batchTypes";

export const MAX_BATCH_FILES = 50;
export const MAX_BATCH_TOTAL_SIZE = 200 * 1024 * 1024;

export const fileFingerprint = (file: File) => `${file.name.toLowerCase()}::${file.size}::${file.lastModified}`;

export const selectNewBatchFiles = (existing: BatchFile[], incoming: File[]) => {
  const fingerprints = new Set(existing.map((item) => fileFingerprint(item.file)));
  const existingAccepted = existing.filter((item) => item.status !== "rejected");
  const accepted: File[] = [];
  const rejected: Array<{ file: File; reason: string }> = [];
  let totalSize = existingAccepted.reduce((sum, item) => sum + item.size, 0);
  for (const file of incoming) {
    if (fingerprints.has(fileFingerprint(file))) {
      rejected.push({ file, reason: "Doublon ignoré (même nom, taille et date)." });
      continue;
    }
    if (existingAccepted.length + accepted.length >= MAX_BATCH_FILES) {
      rejected.push({ file, reason: `Limite de ${MAX_BATCH_FILES} images atteinte.` });
      continue;
    }
    const fileError = validateImageFile(file);
    if (fileError === "unsupported") {
      rejected.push({ file, reason: "Format non supporté. Utilisez PNG, JPG, WEBP ou AVIF." });
      continue;
    }
    if (fileError === "too-large") {
      rejected.push({ file, reason: "Fichier supérieur à 25 Mo." });
      continue;
    }
    if (totalSize + file.size > MAX_BATCH_TOTAL_SIZE) {
      rejected.push({ file, reason: "Ce fichier ferait dépasser la limite totale de 200 Mo." });
      continue;
    }
    fingerprints.add(fileFingerprint(file));
    totalSize += file.size;
    accepted.push(file);
  }
  return { accepted, rejected };
};

export const decodeBatchImage = async (file: File, signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Traitement annulé", "AbortError");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (signal?.aborted) throw new DOMException("Traitement annulé", "AbortError");
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Dimensions source invalides.");
    return { image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
};
