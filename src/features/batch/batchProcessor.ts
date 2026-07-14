import type { BatchFile, BatchProgress, BatchSettings } from "./batchTypes";

export type BatchRender = (file: File, settings: BatchSettings, signal: AbortSignal) => Promise<Blob>;
export type BatchUpdate = (files: BatchFile[], progress: BatchProgress) => void;

export const calculateBatchProgress = (files: BatchFile[]): BatchProgress => {
  const finishedStatuses = new Set(["completed", "failed", "rejected", "cancelled"]);
  const finished = files.filter((file) => finishedStatuses.has(file.status)).length;
  return {
    total: files.length,
    finished,
    completed: files.filter((file) => file.status === "completed").length,
    failed: files.filter((file) => file.status === "failed").length,
    rejected: files.filter((file) => file.status === "rejected").length,
    cancelled: files.filter((file) => file.status === "cancelled").length,
    percent: files.length ? Math.round((finished / files.length) * 100) : 0,
    currentNames: files.filter((file) => file.status === "processing").map((file) => file.name),
  };
};

export const canTransitionBatchStatus = (from: BatchFile["status"], to: BatchFile["status"]) => {
  const allowed: Record<BatchFile["status"], BatchFile["status"][]> = {
    validating: ["ready", "rejected", "cancelled"],
    ready: ["processing", "cancelled"],
    processing: ["completed", "failed", "cancelled"],
    completed: ["ready"],
    failed: ["ready"],
    rejected: [],
    cancelled: ["ready"],
  };
  return allowed[from].includes(to);
};

export async function processBatch(initialFiles: BatchFile[], settings: BatchSettings, render: BatchRender, onUpdate: BatchUpdate, signal: AbortSignal, concurrency = 2) {
  let files = initialFiles.map((file) => (file.status === "ready" ? { ...file, blob: undefined, error: undefined, progress: 0 } : file));
  const queue = files.filter((file) => file.status === "ready").map((file) => file.id);
  const update = (id: string, patch: Partial<BatchFile>) => {
    files = files.map((file) => (file.id === id ? { ...file, ...patch } : file));
    onUpdate(files, calculateBatchProgress(files));
  };
  onUpdate(files, calculateBatchProgress(files));
  const worker = async () => {
    while (queue.length && !signal.aborted) {
      const id = queue.shift();
      if (!id) return;
      const item = files.find((file) => file.id === id);
      if (!item) continue;
      update(id, { status: "processing", progress: 20 });
      try {
        const blob = await render(item.file, settings, signal);
        if (signal.aborted) update(id, { status: "cancelled", progress: 0, error: "Annulé par l’utilisateur." });
        else update(id, { status: "completed", progress: 100, blob });
      } catch (error) {
        if (signal.aborted || (error instanceof DOMException && error.name === "AbortError")) update(id, { status: "cancelled", progress: 0, error: "Annulé par l’utilisateur." });
        else update(id, { status: "failed", progress: 100, error: error instanceof Error ? error.message : "Échec du rendu." });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(4, concurrency)) }, worker));
  if (signal.aborted)
    files = files.map((file) =>
      file.status === "ready" || file.status === "processing" ? { ...file, status: "cancelled", progress: 0, error: "Annulé par l’utilisateur." } : file,
    );
  onUpdate(files, calculateBatchProgress(files));
  return files;
}
