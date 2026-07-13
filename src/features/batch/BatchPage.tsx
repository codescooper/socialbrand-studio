import { useMemo, useRef, useState } from "react";
import { Check, Download, FileImage, Layers3, Play, RotateCcw, Trash2, Upload, X, XCircle } from "lucide-react";
import { SOCIAL_FORMATS } from "../../constants/socialFormats";
import { renderVisualBlob } from "../../services/visualRenderer";
import type { ExportType } from "../../services/visualRenderer";
import { batchZipFilename, createBatchZip } from "../../services/zipExporter";
import type { BrandKit } from "../../types/brandKit";
import type { NotificationLevel } from "../../types/notification";
import { decodeBatchImage, MAX_BATCH_FILES, MAX_BATCH_TOTAL_SIZE, selectNewBatchFiles } from "./batchValidation";
import { calculateBatchProgress, processBatch } from "./batchProcessor";
import type { BatchFile, BatchJobStatus, BatchSettings } from "./batchTypes";
import { db } from "../../db/database";

type Props = { brandKits: BrandKit[]; initialBrandKit: BrandKit; notify: (level: NotificationLevel, message: string, persistent?: boolean) => void; onHistorySaved?: () => void };
const statusLabels: Record<BatchFile["status"], string> = { validating: "Validation", ready: "Prêt", processing: "Traitement", completed: "Réussi", failed: "Échec", rejected: "Rejeté", cancelled: "Annulé" };
const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;

export function BatchPage({ brandKits, initialBrandKit, notify, onHistorySaved }: Props) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [brandId, setBrandId] = useState(initialBrandKit.id);
  const [socialKey, setSocialKey] = useState("instagram_post");
  const [outputType, setOutputType] = useState<ExportType>("png");
  const [quality, setQuality] = useState(0.9);
  const [jobStatus, setJobStatus] = useState<BatchJobStatus>("idle");
  const [creatingZip, setCreatingZip] = useState(false);
  const [validatingFiles, setValidatingFiles] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const active = jobStatus === "running";
  const locked = active || validatingFiles;
  const progress = useMemo(() => calculateBatchProgress(files), [files]);
  const totalSize = files.filter((file) => file.status !== "rejected").reduce((sum, file) => sum + file.size, 0);
  const selectedBrand = brandKits.find((brand) => brand.id === brandId) || initialBrandKit;
  const settings = useMemo<BatchSettings>(() => {
    const format = SOCIAL_FORMATS[socialKey];
    return { brandKit: { ...selectedBrand, template: { ...selectedBrand.template, outputWidth: format.width, outputHeight: format.height } }, socialFormatKey: socialKey, outputType, jpgQuality: quality };
  }, [selectedBrand, socialKey, outputType, quality]);

  const addFiles = async (incoming: File[]) => {
    if (locked) return;
    setValidatingFiles(true);
    const selected = selectNewBatchFiles(files, incoming);
    const now = Date.now();
    const rejectedItems: BatchFile[] = selected.rejected.map(({ file, reason }, index) => ({ id: `rejected-${now}-${index}`, file, name: file.name, size: file.size, type: file.type, status: "rejected", progress: 100, error: reason }));
    const validating: BatchFile[] = selected.accepted.map((file, index) => ({ id: `batch-${now}-${index}-${file.lastModified}`, file, name: file.name, size: file.size, type: file.type, status: "validating", progress: 0 }));
    let next = [...files, ...rejectedItems, ...validating]; setFiles(next); setJobStatus("idle");
    for (const item of validating) {
      try { const decoded = await decodeBatchImage(item.file); decoded.release(); next = next.map((file) => file.id === item.id ? { ...file, status: "ready", progress: 0, width: decoded.width, height: decoded.height } : file); }
      catch { next = next.map((file) => file.id === item.id ? { ...file, status: "rejected", progress: 100, error: "Image illisible ou impossible à décoder." } : file); }
      setFiles(next);
    }
    setValidatingFiles(false);
    if (selected.rejected.length) notify("warning", `${selected.rejected.length} fichier(s) ignoré(s). Consultez les raisons dans la liste.`, true);
  };

  const start = async () => {
    if (locked || !files.some((file) => file.status === "ready" || file.status === "completed" || file.status === "failed" || file.status === "cancelled")) return;
    const prepared = files.map((file) => ["completed", "failed", "cancelled"].includes(file.status) ? { ...file, status: "ready" as const, progress: 0, blob: undefined, error: undefined } : file);
    setFiles(prepared); setJobStatus("running"); const controller = new AbortController(); abortRef.current = controller; const startedAt = new Date().toISOString();
    let logoIgnored = false;
    const render = async (file: File, currentSettings: BatchSettings, signal: AbortSignal) => {
      const decoded = await decodeBatchImage(file, signal);
      try { return await renderVisualBlob(decoded.image, currentSettings.brandKit, currentSettings.outputType, currentSettings.jpgQuality, () => { logoIgnored = true; }); }
      finally { decoded.release(); }
    };
    const result = await processBatch(prepared, settings, render, (updated) => setFiles(updated), controller.signal, 2);
    const wasCancelled = controller.signal.aborted; setJobStatus(wasCancelled ? "cancelled" : "completed"); abortRef.current = null;
    const finalProgress = calculateBatchProgress(result);
    try { await db.batches.add({ id: crypto.randomUUID(), parameters: { brandKitId: settings.brandKit.id, brandKitName: settings.brandKit.brandName, socialFormat: settings.socialFormatKey, format: settings.outputType, jpgQuality: settings.jpgQuality }, total: finalProgress.total, successes: finalProgress.completed, failures: finalProgress.failed, rejected: finalProgress.rejected, cancelled: wasCancelled, startedAt, finishedAt: new Date().toISOString(), errors: result.filter(item => item.error).slice(0, 10).map(item => `${item.name}: ${item.error}`) }); onHistorySaved?.(); } catch { notify("warning", "Les images ont été traitées, mais l’historique local n’a pas pu être enregistré.", true); }
    notify(wasCancelled || finalProgress.failed || logoIgnored ? "warning" : "success", wasCancelled ? "Traitement annulé. Les réussites restent téléchargeables." : logoIgnored ? `Traitement terminé : ${finalProgress.completed} réussi(s). Le logo illisible a été ignoré.` : `Traitement terminé : ${finalProgress.completed} réussi(s), ${finalProgress.failed} échec(s).`, finalProgress.failed > 0 || logoIgnored);
    window.setTimeout(() => summaryRef.current?.focus(), 0);
  };
  const cancel = () => abortRef.current?.abort();
  const downloadZip = async () => {
    if (!progress.completed || creatingZip) return;
    setCreatingZip(true);
    try { const blob = await createBatchZip(files, settings); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = batchZipFilename(settings); link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); notify("success", "Archive ZIP téléchargée."); }
    catch { notify("error", "Impossible de créer l’archive ZIP.", true); }
    finally { setCreatingZip(false); }
  };
  const remove = (id: string) => !active && setFiles((current) => current.filter((file) => file.id !== id));
  const clear = () => { if (!active) { setFiles([]); setJobStatus("idle"); } };
  const restart = () => { if (!active) { setFiles((current) => current.filter((file) => file.status !== "rejected").map((file) => ({ ...file, status: "ready", progress: 0, blob: undefined, error: undefined }))); setJobStatus("idle"); } };

  return <section className="batch-page">
    <div className="page-heading"><div><span className="eyebrow dark-label"><Layers3 size={14}/> PRODUCTION EN SÉRIE</span><h1>Traitement par lot</h1><p>Jusqu’à {MAX_BATCH_FILES} images, 25 Mo par fichier et {MAX_BATCH_TOTAL_SIZE / 1024 / 1024} Mo au total.</p></div>{files.length > 0 && <button className="outline" disabled={locked} onClick={clear}><Trash2 size={16}/>Tout retirer</button>}</div>
    <div className="batch-layout"><div className="batch-main">
      <label className={`batch-drop ${locked ? "disabled" : ""}`} tabIndex={locked ? -1 : 0} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(Array.from(event.dataTransfer.files)); }} onKeyDown={(event) => { if (!locked && (event.key === "Enter" || event.key === " ")) event.currentTarget.querySelector("input")?.click(); }}><input aria-label="Ajouter plusieurs images" disabled={locked} type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => { const input = event.currentTarget; void addFiles(Array.from(input.files || [])); input.value = ""; }}/><Upload size={26}/><b>{validatingFiles ? "Validation des images…" : "Déposez ou sélectionnez plusieurs images"}</b><span>PNG, JPG, WEBP ou AVIF · ajout possible en plusieurs fois</span></label>
      <div className="batch-counter"><span>{files.filter((file) => file.status !== "rejected").length}/{MAX_BATCH_FILES} images acceptées</span><span>{formatBytes(totalSize)} / 200 Mo</span></div>
      {files.length === 0 ? <div className="batch-empty"><FileImage size={28}/><b>Aucun fichier sélectionné</b><span>Ajoutez au moins une image pour préparer le traitement.</span></div> : <div className="batch-file-list" aria-label="Fichiers du lot">{files.map((item) => <article className={`batch-file status-${item.status}`} key={item.id}><div className="file-status-icon">{item.status === "completed" ? <Check/> : item.status === "failed" || item.status === "rejected" ? <XCircle/> : item.status === "cancelled" ? <X/> : <FileImage/>}</div><div className="batch-file-info"><b>{item.name}</b><span>{formatBytes(item.size)}{item.width ? ` · ${item.width} × ${item.height}px` : ""}</span>{item.error && <small>{item.error}</small>}</div><div className="batch-file-state"><span>{statusLabels[item.status]}</span>{item.status === "processing" && <progress aria-label={`Progression de ${item.name}`} max="100" value={item.progress}/>}</div><button aria-label={`Retirer ${item.name}`} disabled={active} onClick={() => remove(item.id)}><Trash2 size={15}/></button></article>)}</div>}
    </div><aside className="batch-settings"><span className="eyebrow dark-label">PARAMÈTRES DU LOT</span><label><span>Brand Kit</span><select disabled={active} value={brandId} onChange={(event) => setBrandId(event.target.value)}>{brandKits.map((brand) => <option value={brand.id} key={brand.id}>{brand.brandName}</option>)}</select></label><label><span>Format social</span><select disabled={active} value={socialKey} onChange={(event) => setSocialKey(event.target.value)}>{Object.entries(SOCIAL_FORMATS).map(([key, format]) => <option value={key} key={key}>{format.label} — {format.width} × {format.height}</option>)}</select></label><label><span>Format de sortie</span><select disabled={active} value={outputType} onChange={(event) => setOutputType(event.target.value as ExportType)}><option value="png">PNG</option><option value="jpg">JPG</option></select></label>{outputType === "jpg" && <label><span>Qualité JPG — {Math.round(quality * 100)} %</span><input disabled={active} type="range" min="0.5" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))}/></label>}<div className="batch-recap"><div><span>Dimensions</span><b>{settings.brandKit.template.outputWidth} × {settings.brandKit.template.outputHeight}</b></div><div><span>Concurrence</span><b>2 images</b></div></div>{active ? <button className="cancel-button wide" onClick={cancel}><X size={18}/>Annuler le traitement</button> : <button className="primary wide" disabled={validatingFiles || !files.some((file) => file.status === "ready")} onClick={() => void start()}><Play size={18}/>Lancer le traitement</button>}
      {(jobStatus === "running" || jobStatus === "completed" || jobStatus === "cancelled") && <div className="batch-progress" aria-live="polite"><div><b>Progression</b><span>{progress.percent}%</span></div><progress aria-label="Progression globale" max="100" value={progress.percent}/><small>{progress.finished}/{progress.total} terminé(s) · {progress.completed} réussi(s) · {progress.failed} échec(s) · {progress.rejected} rejeté(s)</small>{progress.currentNames.length > 0 && <small>En cours : {progress.currentNames.join(", ")}</small>}</div>}
      {(jobStatus === "completed" || jobStatus === "cancelled") && <div className="batch-final" ref={summaryRef} tabIndex={-1}><h3>Résumé final</h3><p>{progress.completed} réussi(s), {progress.failed} échec(s), {progress.rejected} rejeté(s), {progress.cancelled} annulé(s).</p><button className="primary wide" disabled={!progress.completed || creatingZip} onClick={() => void downloadZip()}><Download size={18}/>{creatingZip ? "Création du ZIP…" : "Télécharger le ZIP"}</button><button className="outline wide" onClick={restart}><RotateCcw size={17}/>Recommencer</button></div>}
    </aside></div>
  </section>;
}
