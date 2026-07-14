import {
  Box,
  CircleHelp,
  Clock3,
  Download,
  Check,
  Copy,
  Edit3,
  FileJson,
  FolderOpen,
  Minus,
  Move,
  RotateCcw,
  Save,
  Trash2,
  Grid2X2,
  Hexagon,
  Image,
  Layers3,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Upload,
  ZoomIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, PointerEvent } from "react";
import { Notifications } from "./components/Notifications";
import { Onboarding } from "./components/Onboarding";
import { BatchPage } from "./features/batch/BatchPage";
import { ExportsPage, HistoryPage, ProjectsPage, StoragePage } from "./features/library/LibraryPages";
import { HelpPage } from "./features/help/HelpPage";
import { saveProject } from "./features/projects/projectService";
import { db } from "./db/database";
import { initializePersistence } from "./db/migrations";
import { brandKitRepository } from "./db/repositories";
import { DEFAULT_BRAND_KIT, TEMPLATE_LIMITS } from "./constants/brandKitDefaults";
import { SOCIAL_FORMATS } from "./constants/socialFormats";
import { normalizeBrandKit, validateBrandKitImport } from "./services/brandKitValidation";
import { renderVisualBlob } from "./services/visualRenderer";
import type { ExportType } from "./services/visualRenderer";
import type { BrandKit } from "./types/brandKit";
import type { AppNotification, NotificationLevel } from "./types/notification";
import type { BatchHistoryRecord, ExportRecord, ProjectRecord } from "./types/persistence";
import { buildExportFilename, resetFileInput, validateImageFile } from "./utils/files";
import { DEFAULT_PREFERENCES, APP_VERSION, isOnboardingComplete, loadPreferences, savePreferences, setOnboardingComplete, type AppPreferences } from "./services/appSettings";
import { openUrl } from "@tauri-apps/plugin-opener";
import { logLocalEvent } from "./services/localLogger";

const nav = [
  [Grid2X2, "Vue d'ensemble"],
  [FolderOpen, "Projets"],
  [Palette, "Brand Kit"],
  [Box, "Produits"],
  [Layers3, "Traitement par lot"],
  [Download, "Exports"],
  [Clock3, "Historique"],
  [Settings, "Paramètres"],
  [CircleHelp, "Aide"],
] as const;

function Bee({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? "bee bee-small" : "bee"} viewBox="0 0 180 160" aria-label="Mascotte abeille digitale">
      <defs>
        <linearGradient id="wing" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".92" />
          <stop offset="1" stopColor="#ffd600" stopOpacity=".25" />
        </linearGradient>
      </defs>
      <g className="bee-float">
        <path d="M63 65C33 42 21 68 32 91c9 19 31 9 43-4M117 65c30-23 42 3 31 26-9 19-31 9-43-4" fill="url(#wing)" stroke="#292929" strokeWidth="5" />
        <path d="M75 46c-7-19-21-18-25-8M105 46c7-19 21-18 25-8" fill="none" stroke="#1b1b1b" strokeLinecap="round" strokeWidth="5" />
        <circle cx="49" cy="36" r="5" fill="#ffd600" stroke="#171717" strokeWidth="3" />
        <circle cx="131" cy="36" r="5" fill="#ffd600" stroke="#171717" strokeWidth="3" />
        <path d="M90 37c33 0 48 24 38 57-8 26-23 42-38 50-15-8-30-24-38-50-10-33 5-57 38-57Z" fill="#ffd600" stroke="#111" strokeWidth="6" />
        <path d="M56 77h68M55 103h70" stroke="#151515" strokeWidth="17" />
        <path d="M77 55c4-5 9-7 13-7s9 2 13 7" fill="none" stroke="#171717" strokeLinecap="round" strokeWidth="4" />
        <circle cx="76" cy="65" r="5" fill="#111" />
        <circle cx="104" cy="65" r="5" fill="#111" />
        <circle cx="74" cy="63" r="1.5" fill="white" />
        <circle cx="102" cy="63" r="1.5" fill="white" />
        <path d="M83 76c5 4 9 4 14 0" fill="none" stroke="#111" strokeLinecap="round" strokeWidth="3" />
        <path d="m61 119-15 12M119 119l15 12" stroke="#111" strokeLinecap="round" strokeWidth="5" />
        <rect x="38" y="128" width="17" height="8" rx="4" fill="#ffd600" stroke="#111" strokeWidth="3" />
        <rect x="125" y="128" width="17" height="8" rx="4" fill="#ffd600" stroke="#111" strokeWidth="3" />
      </g>
    </svg>
  );
}

export default function App() {
  const [active, setActive] = useState("Vue d'ensemble");
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [brandKits, setBrandKits] = useState<BrandKit[]>([{ ...DEFAULT_BRAND_KIT, template: { ...DEFAULT_BRAND_KIT.template } }]);
  const [brandKit, setBrandKit] = useState<BrandKit>({ ...DEFAULT_BRAND_KIT, template: { ...DEFAULT_BRAND_KIT.template } });
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [batches, setBatches] = useState<BatchHistoryRecord[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [socialPreview, setSocialPreview] = useState("instagram_post");
  const [imageLoading, setImageLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<ExportType>("png");
  const [jpgQuality, setJpgQuality] = useState(0.9);
  const [brandSaveStatus, setBrandSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [projectDirty, setProjectDirty] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const imageUrlRef = useRef("");
  const notificationTimer = useRef<number | null>(null);
  const showNotification = (level: NotificationLevel, message: string, persistent = level === "error") => {
    if (notificationTimer.current) window.clearTimeout(notificationTimer.current);
    setNotification({ id: Date.now(), level, message, persistent });
    if (!persistent) notificationTimer.current = window.setTimeout(() => setNotification(null), 4200);
  };
  useEffect(() => {
    logLocalEvent("info", "app_start", { versionMajor: 0, versionMinor: 1 });
    void initializePersistence()
      .then(async (report) => {
        const [prefs, onboardingDone] = await Promise.all([loadPreferences(), isOnboardingComplete()]);
        setPreferences(prefs);
        setExportType(prefs.defaultExportFormat);
        setJpgQuality(prefs.defaultJpgQuality);
        setShowOnboarding(!onboardingDone);
        await refreshData();
        logLocalEvent(report.ignored ? "warning" : "info", "migration_complete", { migrated: report.migrated, repaired: report.repaired, ignored: report.ignored });
        if (report.migrated || report.ignored)
          showNotification(
            report.ignored ? "warning" : "success",
            `Migration locale : ${report.migrated} importé(s), ${report.repaired} réparé(s), ${report.ignored} ignoré(s).`,
            report.ignored > 0,
          );
      })
      .catch((error) => {
        logLocalEvent("error", "storage_start_failed");
        showNotification("error", error instanceof Error ? error.message : "IndexedDB indisponible. Relancez l’application ou restaurez une sauvegarde.", true);
      });
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      if (notificationTimer.current) window.clearTimeout(notificationTimer.current);
    };
  }, []);
  const refreshData = async () => {
    const [kits, nextProjects, nextExports, nextBatches] = await Promise.all([
      brandKitRepository.list(),
      db.projects.orderBy("lastOpenedAt").reverse().toArray(),
      db.exports.orderBy("exportedAt").reverse().toArray(),
      db.batches.orderBy("finishedAt").reverse().toArray(),
    ]);
    if (kits.length) {
      const content = kits.map((item) => item.content);
      setBrandKits(content);
      setBrandKit((current) => content.find((item) => item.id === current.id) || content[0]);
    }
    setProjects(nextProjects);
    setExports(nextExports);
    setBatches(nextBatches);
  };
  const openModule = (label: string) => {
    if (active === "Produits" && label !== "Produits" && projectDirty && !window.confirm("Abandonner les modifications non enregistrées du visuel ?")) return;
    setActive(label);
  };
  const updatePreferences = async (value: AppPreferences) => {
    try {
      const saved = await savePreferences(value);
      setPreferences(saved);
      setExportType(saved.defaultExportFormat);
      setJpgQuality(saved.defaultJpgQuality);
      showNotification("success", "Paramètres sauvegardés.");
    } catch {
      showNotification("error", "Impossible de sauvegarder les paramètres. Les valeurs précédentes sont conservées.", true);
    }
  };
  const closeOnboarding = async (completed: boolean) => {
    await setOnboardingComplete(true);
    setShowOnboarding(false);
    showNotification("success", completed ? "Onboarding terminé. Vous êtes prêt à créer." : "Onboarding ignoré. Vous pouvez le relancer depuis l’aide.");
  };
  const restartOnboarding = async () => {
    await setOnboardingComplete(false);
    setShowOnboarding(true);
  };
  const reportIssue = async () => {
    const url = `https://github.com/codescooper/socialbrand-studio/issues/new?template=bug_report.yml&version=${APP_VERSION}`;
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    showNotification("warning", "Le formulaire de bug s’ouvre dans votre navigateur. Aucune donnée locale n’est envoyée.");
  };
  const loadImage = async (file?: File) => {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError === "unsupported") return showNotification("error", "Format non supporté. Utilisez PNG, JPG, WEBP ou AVIF.", true);
    if (validationError === "too-large") return showNotification("error", "Ce fichier dépasse la taille maximale de 25 Mo.", true);
    setImageLoading(true);
    const nextUrl = URL.createObjectURL(file);
    try {
      const probe = new window.Image();
      probe.src = nextUrl;
      await probe.decode();
      if (!probe.naturalWidth || !probe.naturalHeight) throw new Error("invalid-dimensions");
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = nextUrl;
      setImageUrl(nextUrl);
      setImageFile(file);
      setProjectDirty(true);
      setImageSize({ width: probe.naturalWidth, height: probe.naturalHeight });
      updateTemplate("imageZoom", 1);
      updateTemplate("imageX", 0);
      updateTemplate("imageY", 0);
      setActive("Produits");
      showNotification("success", "Image chargée. Vous pouvez maintenant ajuster son cadrage.");
    } catch {
      URL.revokeObjectURL(nextUrl);
      showNotification("error", "Cette image est illisible ou ne peut pas être décodée.", true);
    } finally {
      setImageLoading(false);
    }
  };
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    void loadImage(input.files?.[0]);
    resetFileInput(input);
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    void loadImage(event.dataTransfer.files?.[0]);
  };
  const updateBrand = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => {
    setBrandSaveStatus("idle");
    setBrandKit((kit) => ({ ...kit, [key]: value }));
  };
  const updateTemplate = <K extends keyof BrandKit["template"]>(key: K, value: BrandKit["template"][K]) => {
    setBrandSaveStatus("idle");
    setProjectDirty(true);
    setBrandKit((kit) => normalizeBrandKit({ ...kit, template: { ...kit.template, [key]: value } }).brandKit);
  };
  const persistBrandKits = async (kits: BrandKit[]) => {
    const now = new Date().toISOString();
    await db.transaction("rw", db.brandKits, async () => {
      const existing = new Map((await db.brandKits.toArray()).map((item) => [item.id, item]));
      await db.brandKits.bulkPut(
        kits.map((kit) => ({ id: kit.id, version: 1 as const, name: kit.brandName, content: kit, createdAt: existing.get(kit.id)?.createdAt || now, updatedAt: now })),
      );
      const removed = [...existing.keys()].filter((id) => !kits.some((kit) => kit.id === id));
      if (removed.length) await db.brandKits.bulkDelete(removed);
    });
    setBrandKits(kits);
  };
  const saveBrandKit = async () => {
    setBrandSaveStatus("saving");
    const normalized = normalizeBrandKit(brandKit).brandKit;
    const exists = brandKits.some((kit) => kit.id === normalized.id);
    const next = exists ? brandKits.map((kit) => (kit.id === normalized.id ? normalized : kit)) : [...brandKits, normalized];
    setBrandKit(normalized);
    try {
      await persistBrandKits(next);
      setBrandSaveStatus("saved");
      showNotification("success", "Brand Kit sauvegardé dans IndexedDB.");
    } catch (error) {
      setBrandSaveStatus("error");
      showNotification("error", error instanceof Error ? error.message : "Erreur de sauvegarde.", true);
    }
  };
  const createBrandKit = () => setBrandKit({ ...DEFAULT_BRAND_KIT, id: crypto.randomUUID(), brandName: "Nouvelle marque", template: { ...DEFAULT_BRAND_KIT.template } });
  const duplicateBrandKit = (kit: BrandKit) => {
    const copy = { ...kit, id: crypto.randomUUID(), brandName: `${kit.brandName} — copie`, template: { ...kit.template } };
    void persistBrandKits([...brandKits, copy]).then(() => showNotification("success", "Brand Kit dupliqué."));
    setBrandKit(copy);
  };
  const deleteBrandKit = (id: string) => {
    if (brandKits.length === 1) return showNotification("warning", "Au moins un Brand Kit doit rester disponible.", true);
    if (!window.confirm("Supprimer définitivement ce Brand Kit ?")) return showNotification("warning", "Suppression annulée.");
    const next = brandKits.filter((kit) => kit.id !== id);
    void persistBrandKits(next).then(() => showNotification("success", "Brand Kit supprimé."));
    if (brandKit.id === id) setBrandKit(next[0]);
  };
  const downloadJson = (kit = brandKit, name = `${brandKit.brandName || "brand-kit"}.json`) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(kit, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const importBrandJson = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showNotification("error", "Le fichier JSON est trop volumineux.", true);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = validateBrandKitImport(parsed);
      if (!result) throw new Error("invalid-structure");
      let imported = result.brandKit;
      if (brandKits.some((kit) => kit.id === imported.id)) imported = { ...imported, id: crypto.randomUUID(), brandName: `${imported.brandName} — importé` };
      await persistBrandKits([...brandKits, imported]);
      setBrandKit(imported);
      showNotification(
        result.repaired ? "warning" : "success",
        result.repaired ? "Brand Kit importé. Certaines données ont été réparées." : "Brand Kit importé dans la bibliothèque.",
        result.repaired,
      );
    } catch {
      showNotification("error", "JSON invalide : la structure ne correspond pas à un Brand Kit.", true);
    }
  };
  const onBrandJsonChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    void importBrandJson(input.files?.[0]);
    resetFileInput(input);
  };
  const loadLogo = (file?: File) => {
    if (!file || !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type) || file.size > 5 * 1024 * 1024)
      return showNotification("error", "Logo non valide. Utilisez PNG, JPG, WEBP ou SVG (5 Mo maximum).", true);
    const reader = new FileReader();
    reader.onerror = () => showNotification("error", "Impossible de lire le logo.", true);
    reader.onload = () => updateBrand("logo", String(reader.result));
    reader.readAsDataURL(file);
  };
  const onLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    loadLogo(input.files?.[0]);
    resetFileInput(input);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: brandKit.template.imageX, py: brandKit.template.imageY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      updateTemplate("imageX", dragStart.current.px + ((e.clientX - dragStart.current.x) / rect.width) * 100);
      updateTemplate("imageY", dragStart.current.py + ((e.clientY - dragStart.current.y) / rect.height) * 100);
    }
  };
  const resetView = () => {
    updateTemplate("imageZoom", 1);
    updateTemplate("imageX", 0);
    updateTemplate("imageY", 0);
  };
  const setFormat = (value: string) => {
    const [w, h] = value.split("x").map(Number);
    updateTemplate("outputWidth", w);
    updateTemplate("outputHeight", h);
  };
  const applySocialFormat = (value: string) => {
    setSocialPreview(value);
    const format = SOCIAL_FORMATS[value];
    if (format) {
      updateTemplate("outputWidth", format.width);
      updateTemplate("outputHeight", format.height);
    }
  };
  const exportVisual = async () => {
    if (!imageUrl || exporting) return showNotification("error", "Chargez une image valide avant d’exporter.", true);
    setExporting(true);
    try {
      const image = new window.Image();
      image.src = imageUrl;
      await image.decode();
      let logoIgnored = false;
      const blob = await renderVisualBlob(image, brandKit, exportType, jpgQuality, () => {
        logoIgnored = true;
      });
      const format = SOCIAL_FORMATS[socialPreview]?.label || `${brandKit.template.outputWidth}x${brandKit.template.outputHeight}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildExportFilename(brandKit.brandName, format, exportType);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      await db.exports.add({
        id: crypto.randomUUID(),
        projectId: currentProjectId,
        filename: link.download,
        brandKitId: brandKit.id,
        brandKitName: brandKit.brandName,
        socialFormat: socialPreview,
        width: brandKit.template.outputWidth,
        height: brandKit.template.outputHeight,
        format: exportType,
        size: blob.size,
        status: "success",
        exportedAt: new Date().toISOString(),
      });
      await refreshData();
      showNotification(
        logoIgnored ? "warning" : "success",
        logoIgnored ? "Export réussi, mais le logo illisible a été ignoré." : `Export ${exportType.toUpperCase()} réussi.`,
        logoIgnored,
      );
    } catch {
      logLocalEvent("error", "single_export_failed");
      try {
        await db.exports.add({
          id: crypto.randomUUID(),
          projectId: currentProjectId,
          filename: "export-echoue",
          brandKitId: brandKit.id,
          brandKitName: brandKit.brandName,
          socialFormat: socialPreview,
          width: brandKit.template.outputWidth,
          height: brandKit.template.outputHeight,
          format: exportType,
          size: 0,
          status: "failed",
          exportedAt: new Date().toISOString(),
          errorMessage: "Rendu impossible",
        });
        await refreshData();
      } catch {
        /* l'erreur principale reste prioritaire */
      }
      showNotification("error", "Export impossible. Vérifiez l’image et réessayez.", true);
    } finally {
      setExporting(false);
    }
  };
  const saveCurrentProject = async () => {
    if (!imageFile) return showNotification("error", "Chargez une image avant d’enregistrer un projet.", true);
    const defaultName = currentProjectId ? projects.find((p) => p.id === currentProjectId)?.name : imageFile.name.replace(/\.[^.]+$/, "");
    const name = prompt("Nom du projet", defaultName || "Nouveau projet");
    if (!name) return;
    try {
      const id = await saveProject({ id: currentProjectId, name, brandKit, socialFormat: socialPreview, exportFormat: exportType, jpgQuality, image: imageFile });
      setCurrentProjectId(id);
      setProjectDirty(false);
      await refreshData();
      showNotification("success", "Projet sauvegardé.");
    } catch (error) {
      showNotification("error", error instanceof Error ? error.message : "Projet non sauvegardé.", true);
    }
  };
  const openProject = async (project: ProjectRecord) => {
    const kit = brandKits.find((item) => item.id === project.brandKitId) || brandKits[0];
    if (!kit) return showNotification("error", "Le Brand Kit du projet manque et aucun remplacement n’est disponible.", true);
    const asset = project.sourceAssetId ? await db.assets.get(project.sourceAssetId) : undefined;
    if (!asset) return showNotification("error", "L’image source de ce projet n’est plus disponible. Le projet reste conservé.", true);
    const file = new File([asset.blob], asset.name, { type: asset.mimeType });
    await loadImage(file);
    setBrandKit({ ...kit, template: project.renderSettings });
    setSocialPreview(project.socialFormat);
    setExportType(project.exportFormat);
    setJpgQuality(project.jpgQuality);
    setCurrentProjectId(project.id);
    await db.projects.update(project.id, { lastOpenedAt: new Date().toISOString() });
    setProjectDirty(false);
  };
  const hasCustomizedBrand = brandKits.some((kit) => kit.id !== DEFAULT_BRAND_KIT.id || kit.brandName !== DEFAULT_BRAND_KIT.brandName || Boolean(kit.logo));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Hexagon size={30} fill="#ffd600" />
            <span>S</span>
          </div>
          <div>
            <b>SocialBrand</b>
            <small>STUDIO</small>
          </div>
        </div>
        <nav>
          {nav.map(([Icon, label]) => (
            <button className={active === label ? "active" : ""} onClick={() => openModule(label)} key={label}>
              <Icon size={19} />
              <span>{label}</span>
              {label === "Traitement par lot" && <i>3</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => openModule("Aide")}>
            <CircleHelp size={19} />
            Aide & ressources
          </button>
          <button onClick={() => openModule("Paramètres")}>
            <Settings size={19} />
            Paramètres
          </button>
        </div>
        <div className="profile local-profile">
          <div className="avatar">S</div>
          <div>
            <strong>Mode local</strong>
            <small>Version {APP_VERSION} · Hors connexion</small>
          </div>
        </div>
      </aside>

      <main>
        <header>
          <div className="header-context">
            <b>{active}</b>
            <span>Données enregistrées localement</span>
          </div>
          <button
            className="new-btn"
            onClick={() => {
              if (projectDirty && !window.confirm("Créer un nouveau visuel et abandonner les modifications non enregistrées ?")) return;
              setCurrentProjectId(undefined);
              setProjectDirty(false);
              openModule("Produits");
            }}
          >
            <Plus size={19} />
            Nouveau visuel
          </button>
        </header>

        <div className="content">
          {active === "Brand Kit" ? (
            <section className="brandkit-page">
              <div className="page-heading">
                <div>
                  <span className="eyebrow dark-label">
                    <Palette size={14} /> IDENTITÉ DE MARQUE
                  </span>
                  <h1>Configurez votre Brand Kit</h1>
                  <p>Définissez vos règles une fois, puis appliquez-les à tous vos visuels.</p>
                </div>
                <div className="heading-actions">
                  <span className={`save-state ${brandSaveStatus}`} aria-live="polite">
                    {brandSaveStatus === "saving"
                      ? "Sauvegarde…"
                      : brandSaveStatus === "saved"
                        ? "Sauvegardé"
                        : brandSaveStatus === "error"
                          ? "Erreur de sauvegarde"
                          : "Modifications non enregistrées"}
                  </span>
                  <label className="outline file-trigger">
                    <Upload size={17} />
                    Importer JSON
                    <input aria-label="Importer un Brand Kit JSON" type="file" accept="application/json,.json" onChange={onBrandJsonChange} />
                  </label>
                  <button className="outline" onClick={() => downloadJson(DEFAULT_BRAND_KIT, "modele-brand-kit.json")}>
                    <FileJson size={17} />
                    Télécharger le modèle
                  </button>
                  <button className="primary" disabled={brandSaveStatus === "saving"} onClick={() => void saveBrandKit()}>
                    <Save size={17} />
                    {brandSaveStatus === "saving" ? "Sauvegarde…" : "Sauvegarder"}
                  </button>
                </div>
              </div>
              <div className="brand-library">
                <div className="library-heading">
                  <div>
                    <h2>Mes Brand Kits</h2>
                    <span>
                      {brandKits.length} marque{brandKits.length > 1 ? "s" : ""} disponible{brandKits.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <button className="outline" onClick={createBrandKit}>
                    <Plus size={16} />
                    Nouveau Brand Kit
                  </button>
                </div>
                <div className="brand-list">
                  {brandKits.map((kit) => (
                    <article
                      role="button"
                      aria-pressed={kit.id === brandKit.id}
                      className={kit.id === brandKit.id ? "selected" : ""}
                      key={kit.id}
                      onClick={() => setBrandKit(kit)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setBrandKit(kit);
                      }}
                    >
                      <div className="kit-swatch" style={{ background: kit.primaryColor }}>
                        {kit.logo ? <img src={kit.logo} alt={`Logo de ${kit.brandName}`} /> : <Hexagon size={20} fill={kit.textColor} />}
                      </div>
                      <div>
                        <b>{kit.brandName}</b>
                        <span>{kit.website || "Aucun site web"}</span>
                      </div>
                      {kit.id === brandKit.id && <Check size={16} className="kit-check" />}
                      <div className="kit-actions">
                        <button
                          aria-label={`Modifier ${kit.brandName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setBrandKit(kit);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          aria-label={`Dupliquer ${kit.brandName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBrandKit(kit);
                          }}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          aria-label={`Supprimer ${kit.brandName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBrandKit(kit.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="brandkit-layout">
                <div className="brand-form">
                  <section className="form-card">
                    <div className="card-title">
                      <span>01</span>
                      <div>
                        <h2>Identité</h2>
                        <p>Les informations principales de votre marque.</p>
                      </div>
                    </div>
                    <div className="field-grid">
                      <label>
                        <span>Nom de la marque</span>
                        <input value={brandKit.brandName} onChange={(e) => updateBrand("brandName", e.target.value)} />
                      </label>
                      <label>
                        <span>Slogan</span>
                        <input value={brandKit.slogan} onChange={(e) => updateBrand("slogan", e.target.value)} />
                      </label>
                      <label>
                        <span>Téléphone / WhatsApp</span>
                        <input value={brandKit.contact} onChange={(e) => updateBrand("contact", e.target.value)} />
                      </label>
                      <label>
                        <span>Site web</span>
                        <input value={brandKit.website} onChange={(e) => updateBrand("website", e.target.value)} />
                      </label>
                    </div>
                  </section>
                  <section className="form-card">
                    <div className="card-title">
                      <span>02</span>
                      <div>
                        <h2>Logo et couleurs</h2>
                        <p>Personnalisez l’apparence de vos créations.</p>
                      </div>
                    </div>
                    <div className="logo-colors">
                      <label className="logo-upload">
                        <input aria-label="Importer le logo de la marque" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={onLogoChange} />
                        {brandKit.logo ? (
                          <img src={brandKit.logo} alt={`Logo de ${brandKit.brandName}`} />
                        ) : (
                          <>
                            <Upload size={22} />
                            <b>Ajouter un logo</b>
                            <small>PNG, JPG, WEBP ou SVG · 5 Mo max.</small>
                          </>
                        )}
                      </label>
                      <div className="color-fields">
                        <label>
                          <span>Couleur principale</span>
                          <div>
                            <input
                              aria-label="Sélecteur de couleur principale"
                              type="color"
                              value={brandKit.primaryColor}
                              onChange={(e) => updateBrand("primaryColor", e.target.value)}
                            />
                            <input
                              aria-label="Code hexadécimal de la couleur principale"
                              value={brandKit.primaryColor}
                              onChange={(e) => updateBrand("primaryColor", e.target.value)}
                            />
                          </div>
                        </label>
                        <label>
                          <span>Couleur secondaire</span>
                          <div>
                            <input
                              aria-label="Sélecteur de couleur secondaire"
                              type="color"
                              value={brandKit.secondaryColor}
                              onChange={(e) => updateBrand("secondaryColor", e.target.value)}
                            />
                            <input
                              aria-label="Code hexadécimal de la couleur secondaire"
                              value={brandKit.secondaryColor}
                              onChange={(e) => updateBrand("secondaryColor", e.target.value)}
                            />
                          </div>
                        </label>
                        <label>
                          <span>Couleur du texte</span>
                          <div>
                            <input aria-label="Sélecteur de couleur du texte" type="color" value={brandKit.textColor} onChange={(e) => updateBrand("textColor", e.target.value)} />
                            <input aria-label="Code hexadécimal de la couleur du texte" value={brandKit.textColor} onChange={(e) => updateBrand("textColor", e.target.value)} />
                          </div>
                        </label>
                      </div>
                    </div>
                  </section>
                  <section className="form-card">
                    <div className="card-title">
                      <span>03</span>
                      <div>
                        <h2>Règles du template</h2>
                        <p>Contrôlez les éléments appliqués automatiquement.</p>
                      </div>
                    </div>
                    <div className="rule-list">
                      <label>
                        <div>
                          <b>Afficher le logo</b>
                          <small>Place le logo dans le bandeau inférieur.</small>
                        </div>
                        <input type="checkbox" checked={brandKit.template.showLogo} onChange={(e) => updateTemplate("showLogo", e.target.checked)} />
                      </label>
                      <label>
                        <div>
                          <b>Afficher les contacts</b>
                          <small>Ajoute téléphone et site web.</small>
                        </div>
                        <input type="checkbox" checked={brandKit.template.showContact} onChange={(e) => updateTemplate("showContact", e.target.checked)} />
                      </label>
                      <label className="range-rule">
                        <div>
                          <b>Hauteur du bandeau</b>
                          <small>{brandKit.template.footerHeight}% de l’image</small>
                        </div>
                        <input type="range" min="10" max="30" value={brandKit.template.footerHeight} onChange={(e) => updateTemplate("footerHeight", Number(e.target.value))} />
                      </label>
                    </div>
                  </section>
                </div>
                <aside className="brand-preview">
                  <span className="eyebrow dark-label">APERÇU DU TEMPLATE</span>
                  <div className="brand-mock" style={{ background: brandKit.secondaryColor }}>
                    <div className="mock-product">
                      <Bee small />
                    </div>
                    <div className="mock-footer" style={{ background: brandKit.primaryColor, color: brandKit.textColor, height: `${brandKit.template.footerHeight}%` }}>
                      {brandKit.template.showLogo && (
                        <div className="mock-brand">
                          {brandKit.logo ? <img src={brandKit.logo} alt={`Logo de ${brandKit.brandName}`} /> : <Hexagon fill={brandKit.textColor} />}
                          <b>{brandKit.brandName}</b>
                        </div>
                      )}
                      {brandKit.template.showContact && (
                        <small>
                          {brandKit.contact}
                          <br />
                          {brandKit.website}
                        </small>
                      )}
                    </div>
                  </div>
                  <h3>Template Basic</h3>
                  <p>Logo et contacts placés automatiquement en bas de l’image.</p>
                  <button className="outline wide" onClick={() => downloadJson()}>
                    <Download size={17} />
                    Exporter ce Brand Kit
                  </button>
                  <button className="primary wide" onClick={() => openModule("Produits")}>
                    <Image size={17} />
                    Appliquer à une image
                  </button>
                </aside>
              </div>
            </section>
          ) : active === "Produits" ? (
            <section className="products-page">
              <div className="page-heading">
                <div>
                  <span className="eyebrow dark-label">
                    <Box size={14} /> IMAGE PRODUIT
                  </span>
                  <h1>{imageUrl ? "Cadrez et exportez votre visuel" : "Importez votre première image"}</h1>
                  <p>Utilisez une image PNG, JPG, WEBP ou AVIF de 25 Mo maximum.</p>
                </div>
                <label className={`new-btn file-trigger ${imageLoading ? "disabled" : ""}`}>
                  <Plus size={19} />
                  {imageLoading ? "Décodage…" : "Ajouter une image"}
                  <input aria-label="Ajouter une image produit" disabled={imageLoading} type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={onFileChange} />
                </label>
              </div>
              {!imageUrl ? (
                <label
                  className={`drop-zone ${imageLoading ? "loading" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") e.currentTarget.querySelector("input")?.click();
                  }}
                >
                  <input aria-label="Importer une image produit" disabled={imageLoading} type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={onFileChange} />
                  <div className="upload-orbit">
                    <Upload size={28} />
                  </div>
                  <h2>{imageLoading ? "Décodage de l’image…" : "Déposez votre image ici"}</h2>
                  <p>{imageLoading ? "Veuillez patienter." : "ou appuyez sur Entrée pour parcourir vos fichiers"}</p>
                  <span>PNG, JPG, WEBP ou AVIF • 25 Mo maximum</span>
                </label>
              ) : (
                <div className="image-workspace editor-workspace">
                  <article className="image-preview">
                    <div className="viewer-toolbar">
                      <div>
                        <Move size={15} />
                        <span>Glissez l’image pour ajuster son cadrage</span>
                      </div>
                      <div>
                        <button aria-label="Réduire le zoom" onClick={() => updateTemplate("imageZoom", Math.max(0.5, brandKit.template.imageZoom - 0.1))}>
                          <Minus size={16} />
                        </button>
                        <span>{Math.round(brandKit.template.imageZoom * 100)}%</span>
                        <button aria-label="Augmenter le zoom" onClick={() => updateTemplate("imageZoom", Math.min(3, brandKit.template.imageZoom + 0.1))}>
                          <ZoomIn size={16} />
                        </button>
                        <button aria-label="Réinitialiser le cadrage" onClick={resetView}>
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>
                    <div
                      className={`preview-canvas adaptive-canvas ${dragging ? "dragging" : ""}`}
                      style={{
                        aspectRatio: `${brandKit.template.outputWidth} / ${brandKit.template.outputHeight}`,
                        width: `min(100%, ${Math.round((660 * brandKit.template.outputWidth) / brandKit.template.outputHeight)}px)`,
                        backgroundColor: brandKit.secondaryColor,
                      }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={() => setDragging(false)}
                      onPointerCancel={() => setDragging(false)}
                    >
                      <img
                        src={imageUrl}
                        alt="Produit importé"
                        draggable={false}
                        style={{
                          objectFit: brandKit.template.imageFit,
                          transform: `translate(${brandKit.template.imageX}%, ${brandKit.template.imageY}%) scale(${brandKit.template.imageZoom})`,
                        }}
                      />
                      <div className="live-footer" style={{ background: brandKit.primaryColor, height: `${brandKit.template.footerHeight}%` }} />
                      {brandKit.template.showLogo && brandKit.logo && (
                        <img
                          className="overlay-logo"
                          src={brandKit.logo}
                          alt=""
                          style={{ left: `${brandKit.template.logoX}%`, top: `${brandKit.template.logoY}%`, width: `${brandKit.template.logoSize}%` }}
                        />
                      )}
                      <b
                        className="overlay-name"
                        style={{ left: `${brandKit.template.nameX}%`, top: `${brandKit.template.nameY}%`, color: brandKit.textColor, fontSize: `${brandKit.template.nameSize}cqw` }}
                      >
                        {brandKit.brandName}
                      </b>
                      {brandKit.template.showContact && (
                        <span
                          className="overlay-contact"
                          style={{
                            left: `${brandKit.template.contactX}%`,
                            top: `${brandKit.template.contactY}%`,
                            color: brandKit.textColor,
                            fontSize: `${brandKit.template.contactSize}cqw`,
                          }}
                        >
                          {brandKit.contact} • {brandKit.website}
                        </span>
                      )}
                    </div>
                    <div className="file-meta">
                      <div className="file-type">
                        <Image size={20} />
                      </div>
                      <div>
                        <strong>{imageFile?.name}</strong>
                        <span>
                          Source {imageSize.width} × {imageSize.height}px • Sortie {brandKit.template.outputWidth} × {brandKit.template.outputHeight}px
                        </span>
                      </div>
                      <i>Aperçu fidèle</i>
                    </div>
                  </article>
                  <aside className="quick-panel editor-panel">
                    <span className="eyebrow dark-label">
                      <Sparkles size={14} /> MISE EN PAGE
                    </span>
                    <h2>Ajustez votre visuel</h2>
                    <p>L’aperçu et l’export utilisent exactement les mêmes réglages.</p>
                    <div className="editor-controls">
                      <label>
                        <span>Brand Kit appliqué</span>
                        <select
                          value={brandKit.id}
                          onChange={(e) => {
                            const selected = brandKits.find((kit) => kit.id === e.target.value);
                            if (selected) setBrandKit(selected);
                          }}
                        >
                          {brandKits.map((kit) => (
                            <option value={kit.id} key={kit.id}>
                              {kit.brandName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Aperçu par réseau social</span>
                        <select value={socialPreview} onChange={(e) => applySocialFormat(e.target.value)}>
                          {Object.entries(SOCIAL_FORMATS).map(([key, format]) => (
                            <option value={key} key={key}>
                              {format.label} — {format.width} × {format.height}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Format de sortie</span>
                        <select
                          value={
                            ["1080x1080", "1080x1350", "1080x1920", "1200x628", `${imageSize.width}x${imageSize.height}`].includes(
                              `${brandKit.template.outputWidth}x${brandKit.template.outputHeight}`,
                            )
                              ? `${brandKit.template.outputWidth}x${brandKit.template.outputHeight}`
                              : "custom"
                          }
                          onChange={(e) => e.target.value !== "custom" && setFormat(e.target.value)}
                        >
                          <option value="1080x1080">Carré — 1080 × 1080</option>
                          <option value="1080x1350">Portrait — 1080 × 1350</option>
                          <option value="1080x1920">Story — 1080 × 1920</option>
                          <option value="1200x628">Paysage — 1200 × 628</option>
                          <option value={`${imageSize.width}x${imageSize.height}`}>
                            Format original — {imageSize.width} × {imageSize.height}
                          </option>
                          <option value="custom">Format personnalisé</option>
                        </select>
                      </label>
                      <div className="dimension-controls">
                        <label>
                          <span>Largeur (px)</span>
                          <input
                            type="number"
                            min={TEMPLATE_LIMITS.dimension.min}
                            max={TEMPLATE_LIMITS.dimension.max}
                            value={brandKit.template.outputWidth}
                            onChange={(e) => updateTemplate("outputWidth", Number(e.target.value))}
                          />
                        </label>
                        <span>×</span>
                        <label>
                          <span>Hauteur (px)</span>
                          <input
                            type="number"
                            min={TEMPLATE_LIMITS.dimension.min}
                            max={TEMPLATE_LIMITS.dimension.max}
                            value={brandKit.template.outputHeight}
                            onChange={(e) => updateTemplate("outputHeight", Number(e.target.value))}
                          />
                        </label>
                      </div>
                      <div className="two-controls">
                        <label>
                          <span>Ajustement</span>
                          <select value={brandKit.template.imageFit} onChange={(e) => updateTemplate("imageFit", e.target.value as "cover" | "contain")}>
                            <option value="cover">Remplir</option>
                            <option value="contain">Image entière</option>
                          </select>
                        </label>
                        <label>
                          <span>Bandeau {brandKit.template.footerHeight}%</span>
                          <input type="range" min="8" max="35" value={brandKit.template.footerHeight} onChange={(e) => updateTemplate("footerHeight", Number(e.target.value))} />
                        </label>
                      </div>
                      <div className="control-group">
                        <b>Logo</b>
                        <label>
                          <span>Position X</span>
                          <input type="range" min="0" max="80" value={brandKit.template.logoX} onChange={(e) => updateTemplate("logoX", Number(e.target.value))} />
                        </label>
                        <label>
                          <span>Position Y</span>
                          <input type="range" min="5" max="98" value={brandKit.template.logoY} onChange={(e) => updateTemplate("logoY", Number(e.target.value))} />
                        </label>
                        <label>
                          <span>Taille</span>
                          <input type="range" min="3" max="30" value={brandKit.template.logoSize} onChange={(e) => updateTemplate("logoSize", Number(e.target.value))} />
                        </label>
                      </div>
                      <div className="control-group">
                        <b>Nom de marque</b>
                        <label>
                          <span>Position X</span>
                          <input type="range" min="0" max="95" value={brandKit.template.nameX} onChange={(e) => updateTemplate("nameX", Number(e.target.value))} />
                        </label>
                        <label>
                          <span>Position Y</span>
                          <input type="range" min="5" max="98" value={brandKit.template.nameY} onChange={(e) => updateTemplate("nameY", Number(e.target.value))} />
                        </label>
                        <label>
                          <span>Taille</span>
                          <input type="range" min="1" max="8" step=".1" value={brandKit.template.nameSize} onChange={(e) => updateTemplate("nameSize", Number(e.target.value))} />
                        </label>
                      </div>
                      <div className="control-group">
                        <b>Contacts</b>
                        <label>
                          <span>Position X</span>
                          <input type="range" min="20" max="100" value={brandKit.template.contactX} onChange={(e) => updateTemplate("contactX", Number(e.target.value))} />
                        </label>
                        <label>
                          <span>Position Y</span>
                          <input type="range" min="5" max="98" value={brandKit.template.contactY} onChange={(e) => updateTemplate("contactY", Number(e.target.value))} />
                        </label>
                        <label>
                          <span>Taille</span>
                          <input
                            type="range"
                            min="1"
                            max="6"
                            step=".1"
                            value={brandKit.template.contactSize}
                            onChange={(e) => updateTemplate("contactSize", Number(e.target.value))}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="export-options">
                      <label>
                        <span>Format d’export</span>
                        <select value={exportType} onChange={(e) => setExportType(e.target.value as ExportType)}>
                          <option value="png">PNG</option>
                          <option value="jpg">JPG</option>
                        </select>
                      </label>
                      {exportType === "jpg" && (
                        <label>
                          <span>Qualité JPG — {Math.round(jpgQuality * 100)} %</span>
                          <input type="range" min="0.5" max="1" step="0.05" value={jpgQuality} onChange={(e) => setJpgQuality(Number(e.target.value))} />
                        </label>
                      )}
                    </div>
                    <button className="primary wide" disabled={!imageUrl || exporting || imageLoading} onClick={exportVisual}>
                      <Download size={18} />
                      {exporting ? "Export en cours…" : `Exporter en ${exportType.toUpperCase()}`}
                    </button>
                    <button className="outline wide" disabled={!imageFile} onClick={() => void saveCurrentProject()}>
                      <FolderOpen size={18} />
                      {currentProjectId ? "Mettre à jour le projet" : "Enregistrer comme projet"}
                    </button>
                    <button className="outline wide" onClick={() => void saveBrandKit()}>
                      <Save size={18} />
                      Enregistrer cette mise en page
                    </button>
                    <button className="outline wide" onClick={resetView}>
                      <RotateCcw size={18} />
                      Réinitialiser le cadrage
                    </button>
                    <label className="outline wide replace-trigger">
                      <Upload size={18} />
                      Remplacer l’image
                      <input aria-label="Remplacer l’image produit" type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={onFileChange} />
                    </label>
                  </aside>
                </div>
              )}
            </section>
          ) : active === "Traitement par lot" ? (
            <BatchPage
              brandKits={brandKits}
              initialBrandKit={brandKit}
              notify={showNotification}
              onHistorySaved={() => void refreshData()}
              concurrency={preferences.batchConcurrency}
            />
          ) : active === "Projets" ? (
            <ProjectsPage onOpen={(project) => void openProject(project)} notify={showNotification} />
          ) : active === "Exports" ? (
            <ExportsPage items={exports} />
          ) : active === "Historique" ? (
            <HistoryPage exports={exports} batches={batches} onRefresh={() => void refreshData()} notify={showNotification} />
          ) : active === "Paramètres" ? (
            <StoragePage
              notify={showNotification}
              onRefresh={() => void refreshData()}
              preferences={preferences}
              onPreferencesChange={(value) => void updatePreferences(value)}
              onRestartOnboarding={() => void restartOnboarding()}
              onOpenHelp={() => openModule("Aide")}
            />
          ) : active === "Aide" ? (
            <HelpPage onRestartOnboarding={() => void restartOnboarding()} onReportIssue={() => void reportIssue()} />
          ) : (
            <>
              <section className="welcome">
                <div>
                  <span className="eyebrow">
                    <Sparkles size={14} /> SOCIALBRAND STUDIO
                  </span>
                  <h1>
                    Créez des visuels
                    <br />
                    <em>cohérents avec votre marque.</em>
                  </h1>
                  <p>Vos images, projets et Brand Kits restent sur cet appareil.</p>
                  <div className="welcome-actions">
                    <button className="primary" onClick={() => openModule("Produits")}>
                      <Image size={19} />
                      Créer un visuel
                    </button>
                    <button className="secondary" onClick={() => openModule("Traitement par lot")}>
                      <Layers3 size={19} />
                      Traiter plusieurs images
                    </button>
                  </div>
                </div>
                <div className="bee-zone">
                  <div className="pixel p1" />
                  <div className="pixel p2" />
                  <div className="pixel p3" />
                  <Bee />
                </div>
              </section>

              <section className="stats">
                <article>
                  <div className="stat-icon yellow">
                    <Image size={21} />
                  </div>
                  <div>
                    <small>Exports</small>
                    <strong>{exports.length}</strong>
                    <span>Réellement générés</span>
                  </div>
                </article>
                <article>
                  <div className="stat-icon dark">
                    <FolderOpen size={21} />
                  </div>
                  <div>
                    <small>Projets</small>
                    <strong>{projects.length}</strong>
                    <span>Enregistrés localement</span>
                  </div>
                </article>
                <article>
                  <div className="stat-icon dark">
                    <Palette size={21} />
                  </div>
                  <div>
                    <small>Brand Kits</small>
                    <strong>{brandKits.length}</strong>
                    <span>Disponibles</span>
                  </div>
                </article>
                <article>
                  <div className="stat-icon dark">
                    <Layers3 size={21} />
                  </div>
                  <div>
                    <small>Lots</small>
                    <strong>{batches.length}</strong>
                    <span>Dans l’historique</span>
                  </div>
                </article>
              </section>

              <section className="startup-checklist" aria-labelledby="startup-title">
                <div>
                  <span className="eyebrow dark-label">PREMIERS PAS</span>
                  <h2 id="startup-title">Checklist de démarrage</h2>
                </div>
                <ul>
                  <li className={hasCustomizedBrand ? "done" : ""}>
                    <Check size={16} />
                    <span>Brand Kit créé</span>
                    <button onClick={() => openModule("Brand Kit")}>{hasCustomizedBrand ? "Voir" : "Créer"}</button>
                  </li>
                  <li className={projects.length > 0 ? "done" : ""}>
                    <Check size={16} />
                    <span>Premier projet créé</span>
                    <button onClick={() => openModule(projects.length ? "Projets" : "Produits")}>{projects.length ? "Voir" : "Commencer"}</button>
                  </li>
                  <li className={exports.length > 0 ? "done" : ""}>
                    <Check size={16} />
                    <span>Premier export effectué</span>
                    <button onClick={() => openModule(exports.length ? "Exports" : "Produits")}>{exports.length ? "Voir" : "Exporter"}</button>
                  </li>
                  <li className={batches.length > 0 ? "done" : ""}>
                    <Check size={16} />
                    <span>Premier traitement par lot</span>
                    <button onClick={() => openModule("Traitement par lot")}>{batches.length ? "Voir" : "Essayer"}</button>
                  </li>
                </ul>
              </section>

              <div className="section-title">
                <div>
                  <h2>Projets récents</h2>
                  <p>Reprenez là où vous vous êtes arrêté.</p>
                </div>
                <button onClick={() => openModule("Projets")}>
                  Voir tous les projets <span>→</span>
                </button>
              </div>
              <section className="projects">
                <button
                  className="create-card"
                  onClick={() => {
                    setCurrentProjectId(undefined);
                    openModule("Produits");
                  }}
                >
                  <div>
                    <Plus size={25} />
                  </div>
                  <strong>Nouveau projet</strong>
                  <span>Commencer une nouvelle création</span>
                </button>
                {projects.slice(0, 3).map((p) => (
                  <article
                    className="project"
                    key={p.id}
                    tabIndex={0}
                    onClick={() => void openProject(p)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void openProject(p);
                    }}
                  >
                    <div className="thumb sunset">
                      <span className="mock-logo">PROJET</span>
                      <b>
                        {p.renderSettings.outputWidth}×{p.renderSettings.outputHeight}
                      </b>
                      <div className="product-shape" />
                    </div>
                    <div className="project-info">
                      <div>
                        <strong>{p.name}</strong>
                        <span>Ouvert le {new Date(p.lastOpenedAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <i className="done">Reprendre</i>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </main>
      <Notifications notification={notification} onDismiss={() => setNotification(null)} />
      {showOnboarding && <Onboarding onClose={(completed) => void closeOnboarding(completed)} />}
    </div>
  );
}
