import {
  Bell, Box, ChevronDown, CircleHelp, Clock3, Download,
  Check, Copy, Edit3, FileJson, Minus, Move, RotateCcw, Save, Trash2,
  Grid2X2, Hexagon, Image, Layers3, LayoutTemplate, Palette, Plus,
  Search, Settings, Sparkles, Upload, WandSparkles, ZoomIn,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, PointerEvent } from "react";

type BrandKit = {
  id: string;
  version: 1;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  contact: string;
  website: string;
  slogan: string;
  logo: string;
  template: {
    showLogo: boolean; showContact: boolean; footerHeight: number;
    outputWidth: number; outputHeight: number; imageFit: "cover" | "contain";
    imageZoom: number; imageX: number; imageY: number;
    logoX: number; logoY: number; logoSize: number;
    nameX: number; nameY: number; nameSize: number;
    contactX: number; contactY: number; contactSize: number;
  };
};

const defaultBrandKit: BrandKit = {
  id: "brand-default",
  version: 1,
  brandName: "Ma marque",
  primaryColor: "#FFD600",
  secondaryColor: "#111111",
  textColor: "#111111",
  contact: "+33 6 00 00 00 00",
  website: "www.mamarque.fr",
  slogan: "Votre slogan ici",
  logo: "",
  template: {
    showLogo: true, showContact: true, footerHeight: 18,
    outputWidth: 1080, outputHeight: 1080, imageFit: "cover",
    imageZoom: 1, imageX: 0, imageY: 0,
    logoX: 5, logoY: 91, logoSize: 10,
    nameX: 17, nameY: 91, nameSize: 3.2,
    contactX: 95, contactY: 91, contactSize: 2.1,
  },
};

const nav = [
  [Grid2X2, "Vue d'ensemble"], [Palette, "Brand Kit"], [Box, "Produits"],
  [LayoutTemplate, "Templates"], [Layers3, "Traitement par lot"],
  [Download, "Exports"], [Clock3, "Historique"],
] as const;

const socialFormats: Record<string, { label: string; width: number; height: number }> = {
  instagram_post: { label: "Instagram — Post carré", width: 1080, height: 1080 },
  instagram_portrait: { label: "Instagram — Portrait", width: 1080, height: 1350 },
  instagram_story: { label: "Instagram — Story / Reel", width: 1080, height: 1920 },
  facebook_post: { label: "Facebook — Publication", width: 1200, height: 630 },
  linkedin_post: { label: "LinkedIn — Publication", width: 1200, height: 627 },
  tiktok: { label: "TikTok — Vidéo verticale", width: 1080, height: 1920 },
  pinterest: { label: "Pinterest — Épingle", width: 1000, height: 1500 },
  whatsapp: { label: "WhatsApp — Catalogue", width: 1080, height: 1080 },
};

function Bee({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? "bee bee-small" : "bee"} viewBox="0 0 180 160" aria-label="Mascotte abeille digitale">
      <defs><linearGradient id="wing" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".92"/><stop offset="1" stopColor="#ffd600" stopOpacity=".25"/></linearGradient></defs>
      <g className="bee-float">
        <path d="M63 65C33 42 21 68 32 91c9 19 31 9 43-4M117 65c30-23 42 3 31 26-9 19-31 9-43-4" fill="url(#wing)" stroke="#292929" strokeWidth="5"/>
        <path d="M75 46c-7-19-21-18-25-8M105 46c7-19 21-18 25-8" fill="none" stroke="#1b1b1b" strokeLinecap="round" strokeWidth="5"/>
        <circle cx="49" cy="36" r="5" fill="#ffd600" stroke="#171717" strokeWidth="3"/><circle cx="131" cy="36" r="5" fill="#ffd600" stroke="#171717" strokeWidth="3"/>
        <path d="M90 37c33 0 48 24 38 57-8 26-23 42-38 50-15-8-30-24-38-50-10-33 5-57 38-57Z" fill="#ffd600" stroke="#111" strokeWidth="6"/>
        <path d="M56 77h68M55 103h70" stroke="#151515" strokeWidth="17"/>
        <path d="M77 55c4-5 9-7 13-7s9 2 13 7" fill="none" stroke="#171717" strokeLinecap="round" strokeWidth="4"/>
        <circle cx="76" cy="65" r="5" fill="#111"/><circle cx="104" cy="65" r="5" fill="#111"/>
        <circle cx="74" cy="63" r="1.5" fill="white"/><circle cx="102" cy="63" r="1.5" fill="white"/>
        <path d="M83 76c5 4 9 4 14 0" fill="none" stroke="#111" strokeLinecap="round" strokeWidth="3"/>
        <path d="m61 119-15 12M119 119l15 12" stroke="#111" strokeLinecap="round" strokeWidth="5"/>
        <rect x="38" y="128" width="17" height="8" rx="4" fill="#ffd600" stroke="#111" strokeWidth="3"/><rect x="125" y="128" width="17" height="8" rx="4" fill="#ffd600" stroke="#111" strokeWidth="3"/>
      </g>
    </svg>
  );
}

const projects = [
  { name: "Collection Été 2026", meta: "24 visuels • Instagram", color: "sunset", status: "Terminé" },
  { name: "Promo Week-end", meta: "12 visuels • Multi-format", color: "purple", status: "Terminé" },
  { name: "Nouveaux produits", meta: "48 visuels • En cours", color: "blue", status: "72%" },
];

export default function App() {
  const [active, setActive] = useState("Vue d'ensemble");
  const [notice, setNotice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const loadBrandKits = (): BrandKit[] => {
    try {
      const list = JSON.parse(localStorage.getItem("sbs-brand-kits") || "[]") as Partial<BrandKit>[];
      if (list.length) return list.map((saved) => ({ ...defaultBrandKit, ...saved, id: saved.id || crypto.randomUUID(), template: { ...defaultBrandKit.template, ...saved.template } }));
      const legacy = JSON.parse(localStorage.getItem("sbs-brand-kit") || "");
      return [{ ...defaultBrandKit, ...legacy, id: legacy.id || defaultBrandKit.id, template: { ...defaultBrandKit.template, ...legacy.template } }];
    } catch { return [defaultBrandKit]; }
  };
  const [brandKits, setBrandKits] = useState<BrandKit[]>(loadBrandKits);
  const [brandKit, setBrandKit] = useState<BrandKit>(() => loadBrandKits()[0]);
  const [dragging, setDragging] = useState(false);
  const [socialPreview, setSocialPreview] = useState("instagram_post");
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const action = (label: string) => { setNotice(`${label} — module bientôt disponible`); window.setTimeout(() => setNotice(""), 2400); };
  const openModule = (label: string) => setActive(label);
  const loadImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Ce fichier n’est pas une image compatible.");
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    const nextUrl = URL.createObjectURL(file);
    setImageUrl(nextUrl);
    const probe = new window.Image();
    probe.onload = () => setImageSize({ width: probe.naturalWidth, height: probe.naturalHeight });
    probe.src = nextUrl;
    updateTemplate("imageZoom", 1); updateTemplate("imageX", 0); updateTemplate("imageY", 0);
    setActive("Produits");
    setNotice("Image chargée avec succès");
    window.setTimeout(() => setNotice(""), 2400);
  };
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => loadImage(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    loadImage(event.dataTransfer.files?.[0]);
  };
  const updateBrand = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => setBrandKit((kit) => ({ ...kit, [key]: value }));
  const updateTemplate = <K extends keyof BrandKit["template"]>(key: K, value: BrandKit["template"][K]) => setBrandKit((kit) => ({ ...kit, template: { ...kit.template, [key]: value } }));
  const persistBrandKits = (kits: BrandKit[]) => { setBrandKits(kits); localStorage.setItem("sbs-brand-kits", JSON.stringify(kits)); };
  const saveBrandKit = () => {
    const exists = brandKits.some((kit) => kit.id === brandKit.id);
    const next = exists ? brandKits.map((kit) => kit.id === brandKit.id ? brandKit : kit) : [...brandKits, brandKit];
    persistBrandKits(next); setNotice("Brand Kit sauvegardé dans la bibliothèque"); window.setTimeout(() => setNotice(""), 2400);
  };
  const createBrandKit = () => setBrandKit({ ...defaultBrandKit, id: crypto.randomUUID(), brandName: "Nouvelle marque" });
  const duplicateBrandKit = (kit: BrandKit) => { const copy = { ...kit, id: crypto.randomUUID(), brandName: `${kit.brandName} — copie`, template: { ...kit.template } }; persistBrandKits([...brandKits, copy]); setBrandKit(copy); };
  const deleteBrandKit = (id: string) => { if (brandKits.length === 1) { setNotice("Conservez au moins un Brand Kit"); return; } const next = brandKits.filter((kit) => kit.id !== id); persistBrandKits(next); if (brandKit.id === id) setBrandKit(next[0]); };
  const downloadJson = (kit = brandKit, name = `${brandKit.brandName || "brand-kit"}.json`) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(kit, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
  };
  const importBrandJson = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); const imported = { ...defaultBrandKit, ...parsed, id: brandKits.some((kit) => kit.id === parsed.id) ? crypto.randomUUID() : (parsed.id || crypto.randomUUID()), template: { ...defaultBrandKit.template, ...parsed.template } }; persistBrandKits([...brandKits, imported]); setBrandKit(imported); setNotice("Brand Kit importé et ajouté à la bibliothèque"); } catch { setNotice("JSON invalide : utilisez le modèle proposé"); } window.setTimeout(() => setNotice(""), 2600); };
    reader.readAsText(file);
  };
  const loadLogo = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => updateBrand("logo", String(reader.result)); reader.readAsDataURL(file); };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => { setDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, px: brandKit.template.imageX, py: brandKit.template.imageY }; e.currentTarget.setPointerCapture(e.pointerId); };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => { if (dragging) { const rect = e.currentTarget.getBoundingClientRect(); updateTemplate("imageX", dragStart.current.px + (e.clientX - dragStart.current.x) / rect.width * 100); updateTemplate("imageY", dragStart.current.py + (e.clientY - dragStart.current.y) / rect.height * 100); } };
  const resetView = () => { updateTemplate("imageZoom", 1); updateTemplate("imageX", 0); updateTemplate("imageY", 0); };
  const setFormat = (value: string) => { const [w, h] = value.split("x").map(Number); updateTemplate("outputWidth", w); updateTemplate("outputHeight", h); };
  const applySocialFormat = (value: string) => { setSocialPreview(value); const format = socialFormats[value]; if (format) { updateTemplate("outputWidth", format.width); updateTemplate("outputHeight", format.height); } };
  const exportVisual = async () => {
    if (!imageUrl) return;
    const image = new window.Image(); image.src = imageUrl; await image.decode();
    const t = brandKit.template;
    const canvas = document.createElement("canvas"); canvas.width = t.outputWidth; canvas.height = t.outputHeight;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = brandKit.secondaryColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const fitScale = t.imageFit === "cover" ? Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) : Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const drawW = image.naturalWidth * fitScale * t.imageZoom, drawH = image.naturalHeight * fitScale * t.imageZoom;
    const drawX = (canvas.width - drawW) / 2 + canvas.width * t.imageX / 100, drawY = (canvas.height - drawH) / 2 + canvas.height * t.imageY / 100;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
    const footer = Math.round(canvas.height * t.footerHeight / 100);
    ctx.fillStyle = brandKit.primaryColor; ctx.fillRect(0, canvas.height - footer, canvas.width, footer);
    ctx.fillStyle = brandKit.textColor; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.font = `700 ${canvas.width * t.nameSize / 100}px Arial`; ctx.fillText(brandKit.brandName, canvas.width * t.nameX / 100, canvas.height * t.nameY / 100);
    if (t.showContact) { ctx.textAlign = "right"; ctx.font = `500 ${canvas.width * t.contactSize / 100}px Arial`; ctx.fillText(`${brandKit.contact}  •  ${brandKit.website}`, canvas.width * t.contactX / 100, canvas.height * t.contactY / 100); }
    if (brandKit.logo && t.showLogo) { const logo = new window.Image(); logo.src = brandKit.logo; await logo.decode(); const w = canvas.width * t.logoSize / 100, h = logo.height / logo.width * w; ctx.drawImage(logo, canvas.width * t.logoX / 100, canvas.height * t.logoY / 100 - h / 2, w, h); }
    const link = document.createElement("a"); link.download = `${brandKit.brandName.replace(/\s+/g, "-").toLowerCase()}-visuel.png`; link.href = canvas.toDataURL("image/png"); link.click();
    setNotice("Visuel exporté en PNG"); window.setTimeout(() => setNotice(""), 2400);
  };

  const moduleCopy: Record<string, [string, string]> = {
    "Brand Kit": ["Brand Kit", "Centralisez les couleurs, logos et informations de votre marque."],
    "Templates": ["Templates", "Créez des compositions réutilisables pour tous vos réseaux."],
    "Traitement par lot": ["Traitement par lot", "Transformez plusieurs images en une seule opération."],
    "Exports": ["Exports", "Retrouvez et téléchargez vos créations prêtes à publier."],
    "Historique": ["Historique", "Consultez les dernières opérations réalisées dans le studio."],
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Hexagon size={30} fill="#ffd600"/><span>S</span></div><div><b>SocialBrand</b><small>STUDIO</small></div></div>
      <nav>{nav.map(([Icon, label]) => <button className={active === label ? "active" : ""} onClick={() => openModule(label)} key={label}><Icon size={19}/><span>{label}</span>{label === "Traitement par lot" && <i>3</i>}</button>)}</nav>
      <div className="sidebar-bottom"><button onClick={() => action("Aide")}><CircleHelp size={19}/>Aide & ressources</button><button onClick={() => action("Paramètres")}><Settings size={19}/>Paramètres</button></div>
      <div className="profile"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><small>Studio créatif</small></div><ChevronDown size={16}/></div>
    </aside>

    <main>
      <header><div className="search"><Search size={18}/><input aria-label="Rechercher" placeholder="Rechercher un projet, un produit..."/><kbd>⌘ K</kbd></div><button className="icon-btn" onClick={() => action("Notifications")}><Bell size={19}/><span/></button><button className="new-btn" onClick={() => openModule("Templates")}><Plus size={19}/>Nouveau projet</button></header>

      <div className="content">
        {active === "Brand Kit" ? <section className="brandkit-page">
          <div className="page-heading"><div><span className="eyebrow dark-label"><Palette size={14}/> IDENTITÉ DE MARQUE</span><h1>Configurez votre Brand Kit</h1><p>Définissez vos règles une fois, puis appliquez-les à tous vos visuels.</p></div><div className="heading-actions"><label className="outline file-trigger"><Upload size={17}/>Importer JSON<input type="file" accept="application/json,.json" onChange={(e) => importBrandJson(e.target.files?.[0])}/></label><button className="outline" onClick={() => downloadJson(defaultBrandKit, "modele-brand-kit.json")}><FileJson size={17}/>Télécharger le modèle</button><button className="primary" onClick={saveBrandKit}><Save size={17}/>Sauvegarder</button></div></div>
          <div className="brand-library"><div className="library-heading"><div><h2>Mes Brand Kits</h2><span>{brandKits.length} marque{brandKits.length > 1 ? "s" : ""} disponible{brandKits.length > 1 ? "s" : ""}</span></div><button className="outline" onClick={createBrandKit}><Plus size={16}/>Nouveau Brand Kit</button></div><div className="brand-list">{brandKits.map((kit) => <article className={kit.id === brandKit.id ? "selected" : ""} key={kit.id} onClick={() => setBrandKit(kit)}><div className="kit-swatch" style={{background:kit.primaryColor}}>{kit.logo ? <img src={kit.logo}/> : <Hexagon size={20} fill={kit.textColor}/>}</div><div><b>{kit.brandName}</b><span>{kit.website || "Aucun site web"}</span></div>{kit.id === brandKit.id && <Check size={16} className="kit-check"/>}<div className="kit-actions"><button title="Modifier" onClick={(e) => {e.stopPropagation();setBrandKit(kit)}}><Edit3 size={14}/></button><button title="Dupliquer" onClick={(e) => {e.stopPropagation();duplicateBrandKit(kit)}}><Copy size={14}/></button><button title="Supprimer" onClick={(e) => {e.stopPropagation();deleteBrandKit(kit.id)}}><Trash2 size={14}/></button></div></article>)}</div></div>
          <div className="brandkit-layout"><div className="brand-form">
            <section className="form-card"><div className="card-title"><span>01</span><div><h2>Identité</h2><p>Les informations principales de votre marque.</p></div></div><div className="field-grid"><label><span>Nom de la marque</span><input value={brandKit.brandName} onChange={(e) => updateBrand("brandName", e.target.value)}/></label><label><span>Slogan</span><input value={brandKit.slogan} onChange={(e) => updateBrand("slogan", e.target.value)}/></label><label><span>Téléphone / WhatsApp</span><input value={brandKit.contact} onChange={(e) => updateBrand("contact", e.target.value)}/></label><label><span>Site web</span><input value={brandKit.website} onChange={(e) => updateBrand("website", e.target.value)}/></label></div></section>
            <section className="form-card"><div className="card-title"><span>02</span><div><h2>Logo et couleurs</h2><p>Personnalisez l’apparence de vos créations.</p></div></div><div className="logo-colors"><label className="logo-upload"><input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(e) => loadLogo(e.target.files?.[0])}/>{brandKit.logo ? <img src={brandKit.logo} alt="Logo de la marque"/> : <><Upload size={22}/><b>Ajouter un logo</b><small>PNG, JPG, SVG</small></>}</label><div className="color-fields"><label><span>Couleur principale</span><div><input type="color" value={brandKit.primaryColor} onChange={(e) => updateBrand("primaryColor", e.target.value)}/><input value={brandKit.primaryColor} onChange={(e) => updateBrand("primaryColor", e.target.value)}/></div></label><label><span>Couleur secondaire</span><div><input type="color" value={brandKit.secondaryColor} onChange={(e) => updateBrand("secondaryColor", e.target.value)}/><input value={brandKit.secondaryColor} onChange={(e) => updateBrand("secondaryColor", e.target.value)}/></div></label><label><span>Couleur du texte</span><div><input type="color" value={brandKit.textColor} onChange={(e) => updateBrand("textColor", e.target.value)}/><input value={brandKit.textColor} onChange={(e) => updateBrand("textColor", e.target.value)}/></div></label></div></div></section>
            <section className="form-card"><div className="card-title"><span>03</span><div><h2>Règles du template</h2><p>Contrôlez les éléments appliqués automatiquement.</p></div></div><div className="rule-list"><label><div><b>Afficher le logo</b><small>Place le logo dans le bandeau inférieur.</small></div><input type="checkbox" checked={brandKit.template.showLogo} onChange={(e) => updateTemplate("showLogo", e.target.checked)}/></label><label><div><b>Afficher les contacts</b><small>Ajoute téléphone et site web.</small></div><input type="checkbox" checked={brandKit.template.showContact} onChange={(e) => updateTemplate("showContact", e.target.checked)}/></label><label className="range-rule"><div><b>Hauteur du bandeau</b><small>{brandKit.template.footerHeight}% de l’image</small></div><input type="range" min="10" max="30" value={brandKit.template.footerHeight} onChange={(e) => updateTemplate("footerHeight", Number(e.target.value))}/></label></div></section>
          </div><aside className="brand-preview"><span className="eyebrow dark-label">APERÇU DU TEMPLATE</span><div className="brand-mock" style={{ background: brandKit.secondaryColor }}><div className="mock-product"><Bee small/></div><div className="mock-footer" style={{ background: brandKit.primaryColor, color: brandKit.textColor, height: `${brandKit.template.footerHeight}%` }}>{brandKit.template.showLogo && <div className="mock-brand">{brandKit.logo ? <img src={brandKit.logo}/> : <Hexagon fill={brandKit.textColor}/>}<b>{brandKit.brandName}</b></div>}{brandKit.template.showContact && <small>{brandKit.contact}<br/>{brandKit.website}</small>}</div></div><h3>Template Basic</h3><p>Logo et contacts placés automatiquement en bas de l’image.</p><button className="outline wide" onClick={() => downloadJson()}><Download size={17}/>Exporter ce Brand Kit</button><button className="primary wide" onClick={() => openModule("Produits")}><Image size={17}/>Appliquer à une image</button></aside></div>
        </section> : active === "Produits" ? <section className="products-page">
          <div className="page-heading"><div><span className="eyebrow dark-label"><Box size={14}/> MÉDIATHÈQUE PRODUITS</span><h1>Importez votre première image</h1><p>Ajoutez une photo produit pour tester le studio et préparer votre prochain visuel.</p></div><label className="new-btn file-trigger"><Plus size={19}/>Ajouter une image<input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/heic" onChange={onFileChange}/></label></div>
          {!imageUrl ? <label className="drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/heic" onChange={onFileChange}/>
            <div className="upload-orbit"><Upload size={28}/></div><h2>Déposez votre image ici</h2><p>ou cliquez pour parcourir vos fichiers</p><span>PNG, JPG, WEBP, AVIF ou HEIC • 25 Mo maximum</span>
          </label> : <div className="image-workspace editor-workspace">
            <article className="image-preview">
              <div className="viewer-toolbar"><div><Move size={15}/><span>Glissez l’image pour ajuster son cadrage</span></div><div><button onClick={() => updateTemplate("imageZoom", Math.max(.5, brandKit.template.imageZoom - .1))}><Minus size={16}/></button><span>{Math.round(brandKit.template.imageZoom * 100)}%</span><button onClick={() => updateTemplate("imageZoom", Math.min(3, brandKit.template.imageZoom + .1))}><ZoomIn size={16}/></button><button onClick={resetView}><RotateCcw size={16}/></button></div></div>
              <div className={`preview-canvas adaptive-canvas ${dragging ? "dragging" : ""}`} style={{ aspectRatio: `${brandKit.template.outputWidth} / ${brandKit.template.outputHeight}`, backgroundColor: brandKit.secondaryColor }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
                <img src={imageUrl} alt="Produit importé" draggable={false} style={{ objectFit: brandKit.template.imageFit, transform: `translate(${brandKit.template.imageX}%, ${brandKit.template.imageY}%) scale(${brandKit.template.imageZoom})` }}/>
                <div className="live-footer" style={{ background: brandKit.primaryColor, height: `${brandKit.template.footerHeight}%` }}/>
                {brandKit.template.showLogo && brandKit.logo && <img className="overlay-logo" src={brandKit.logo} alt="" style={{ left: `${brandKit.template.logoX}%`, top: `${brandKit.template.logoY}%`, width: `${brandKit.template.logoSize}%` }}/>} 
                <b className="overlay-name" style={{ left: `${brandKit.template.nameX}%`, top: `${brandKit.template.nameY}%`, color: brandKit.textColor, fontSize: `${brandKit.template.nameSize}cqw` }}>{brandKit.brandName}</b>
                {brandKit.template.showContact && <span className="overlay-contact" style={{ left: `${brandKit.template.contactX}%`, top: `${brandKit.template.contactY}%`, color: brandKit.textColor, fontSize: `${brandKit.template.contactSize}cqw` }}>{brandKit.contact} • {brandKit.website}</span>}
              </div>
              <div className="file-meta"><div className="file-type"><Image size={20}/></div><div><strong>{imageFile?.name}</strong><span>Source {imageSize.width} × {imageSize.height}px • Sortie {brandKit.template.outputWidth} × {brandKit.template.outputHeight}px</span></div><i>Aperçu fidèle</i></div>
            </article>
            <aside className="quick-panel editor-panel"><span className="eyebrow dark-label"><Sparkles size={14}/> MISE EN PAGE</span><h2>Ajustez votre visuel</h2><p>L’aperçu et l’export utilisent exactement les mêmes réglages.</p>
              <div className="editor-controls">
                <label><span>Brand Kit appliqué</span><select value={brandKit.id} onChange={(e) => { const selected = brandKits.find((kit) => kit.id === e.target.value); if (selected) setBrandKit(selected); }}>{brandKits.map((kit) => <option value={kit.id} key={kit.id}>{kit.brandName}</option>)}</select></label>
                <label><span>Aperçu par réseau social</span><select value={socialPreview} onChange={(e) => applySocialFormat(e.target.value)}>{Object.entries(socialFormats).map(([key, format]) => <option value={key} key={key}>{format.label} — {format.width} × {format.height}</option>)}</select></label>
                <label><span>Format de sortie</span><select value={["1080x1080","1080x1350","1080x1920","1200x628",`${imageSize.width}x${imageSize.height}`].includes(`${brandKit.template.outputWidth}x${brandKit.template.outputHeight}`) ? `${brandKit.template.outputWidth}x${brandKit.template.outputHeight}` : "custom"} onChange={(e) => e.target.value !== "custom" && setFormat(e.target.value)}><option value="1080x1080">Carré — 1080 × 1080</option><option value="1080x1350">Portrait — 1080 × 1350</option><option value="1080x1920">Story — 1080 × 1920</option><option value="1200x628">Paysage — 1200 × 628</option><option value={`${imageSize.width}x${imageSize.height}`}>Format original — {imageSize.width} × {imageSize.height}</option><option value="custom">Format personnalisé</option></select></label>
                <div className="dimension-controls"><label><span>Largeur (px)</span><input type="number" min="200" max="6000" value={brandKit.template.outputWidth} onChange={(e) => updateTemplate("outputWidth", Math.max(200, Number(e.target.value)))}/></label><span>×</span><label><span>Hauteur (px)</span><input type="number" min="200" max="6000" value={brandKit.template.outputHeight} onChange={(e) => updateTemplate("outputHeight", Math.max(200, Number(e.target.value)))}/></label></div>
                <div className="two-controls"><label><span>Ajustement</span><select value={brandKit.template.imageFit} onChange={(e) => updateTemplate("imageFit", e.target.value as "cover" | "contain")}><option value="cover">Remplir</option><option value="contain">Image entière</option></select></label><label><span>Bandeau {brandKit.template.footerHeight}%</span><input type="range" min="8" max="35" value={brandKit.template.footerHeight} onChange={(e) => updateTemplate("footerHeight", Number(e.target.value))}/></label></div>
                <div className="control-group"><b>Logo</b><label><span>Position X</span><input type="range" min="0" max="80" value={brandKit.template.logoX} onChange={(e) => updateTemplate("logoX", Number(e.target.value))}/></label><label><span>Position Y</span><input type="range" min="5" max="98" value={brandKit.template.logoY} onChange={(e) => updateTemplate("logoY", Number(e.target.value))}/></label><label><span>Taille</span><input type="range" min="3" max="30" value={brandKit.template.logoSize} onChange={(e) => updateTemplate("logoSize", Number(e.target.value))}/></label></div>
                <div className="control-group"><b>Nom de marque</b><label><span>Position X</span><input type="range" min="0" max="95" value={brandKit.template.nameX} onChange={(e) => updateTemplate("nameX", Number(e.target.value))}/></label><label><span>Position Y</span><input type="range" min="5" max="98" value={brandKit.template.nameY} onChange={(e) => updateTemplate("nameY", Number(e.target.value))}/></label><label><span>Taille</span><input type="range" min="1" max="8" step=".1" value={brandKit.template.nameSize} onChange={(e) => updateTemplate("nameSize", Number(e.target.value))}/></label></div>
                <div className="control-group"><b>Contacts</b><label><span>Position X</span><input type="range" min="20" max="100" value={brandKit.template.contactX} onChange={(e) => updateTemplate("contactX", Number(e.target.value))}/></label><label><span>Position Y</span><input type="range" min="5" max="98" value={brandKit.template.contactY} onChange={(e) => updateTemplate("contactY", Number(e.target.value))}/></label><label><span>Taille</span><input type="range" min="1" max="6" step=".1" value={brandKit.template.contactSize} onChange={(e) => updateTemplate("contactSize", Number(e.target.value))}/></label></div>
              </div>
              <button className="primary wide" onClick={exportVisual}><Download size={18}/>Exporter exactement cet aperçu</button><button className="outline wide" onClick={saveBrandKit}><Save size={18}/>Enregistrer cette mise en page</button><button className="outline wide" onClick={resetView}><RotateCcw size={18}/>Réinitialiser le cadrage</button><label className="outline wide replace-trigger"><Upload size={18}/>Remplacer l’image<input type="file" accept="image/*" onChange={onFileChange}/></label>
            </aside>
          </div>}
        </section> : active === "Traitement par lot" ? <section className="batch-page">
          <div className="page-heading"><div><span className="eyebrow dark-label"><Layers3 size={14}/> PRODUCTION EN SÉRIE</span><h1>Traitement par lot</h1><p>Appliquez une marque et un format social à plusieurs images.</p></div></div>
          <div className="batch-layout"><section className="batch-config"><div className="batch-step"><span>01</span><div><h2>Sélectionnez vos images</h2><p>PNG, JPG, WEBP, AVIF ou HEIC.</p></div></div><label className="batch-drop"><input type="file" accept="image/*" multiple onChange={(e) => setBatchFiles(Array.from(e.target.files || []))}/><Upload size={24}/><b>{batchFiles.length ? `${batchFiles.length} image${batchFiles.length > 1 ? "s" : ""} sélectionnée${batchFiles.length > 1 ? "s" : ""}` : "Choisir plusieurs images"}</b><span>Jusqu’à 10 000 fichiers</span></label><div className="batch-step"><span>02</span><div><h2>Choisissez la marque</h2><p>Le Brand Kit sera appliqué à toutes les images.</p></div></div><div className="batch-brand-list">{brandKits.map((kit) => <button className={kit.id === brandKit.id ? "selected" : ""} onClick={() => setBrandKit(kit)} key={kit.id}><i style={{background:kit.primaryColor}}/><div><b>{kit.brandName}</b><span>{kit.website}</span></div>{kit.id === brandKit.id && <Check size={17}/>}</button>)}</div><div className="batch-step"><span>03</span><div><h2>Choisissez le réseau</h2><p>Les images seront recadrées au format correspondant.</p></div></div><select className="batch-select" value={socialPreview} onChange={(e) => applySocialFormat(e.target.value)}>{Object.entries(socialFormats).map(([key, format]) => <option value={key} key={key}>{format.label} — {format.width} × {format.height}</option>)}</select></section><aside className="batch-summary"><span className="eyebrow dark-label">RÉSUMÉ</span><div className="summary-preview" style={{aspectRatio:`${brandKit.template.outputWidth}/${brandKit.template.outputHeight}`,background:brandKit.secondaryColor}}><Bee small/><div style={{background:brandKit.primaryColor}}><b>{brandKit.brandName}</b></div></div><dl><div><dt>Images</dt><dd>{batchFiles.length}</dd></div><div><dt>Brand Kit</dt><dd>{brandKit.brandName}</dd></div><div><dt>Format</dt><dd>{brandKit.template.outputWidth} × {brandKit.template.outputHeight}</dd></div><div><dt>Réseau</dt><dd>{socialFormats[socialPreview]?.label}</dd></div></dl><button className="primary wide" disabled={!batchFiles.length} onClick={() => action(`Traitement de ${batchFiles.length} images`)}><WandSparkles size={18}/>Lancer le traitement</button></aside></div>
        </section> : active !== "Vue d'ensemble" ? <section className="module-page">
          <div className="module-symbol">{active === "Brand Kit" ? <Palette/> : active === "Templates" ? <LayoutTemplate/> : active === "Traitement par lot" ? <Layers3/> : active === "Exports" ? <Download/> : <Clock3/>}</div>
          <span className="eyebrow dark-label">SOCIALBRAND STUDIO</span><h1>{moduleCopy[active]?.[0]}</h1><p>{moduleCopy[active]?.[1]}</p>
          <button className="primary" onClick={() => active === "Templates" && imageUrl ? action("Éditeur de template") : openModule("Produits")}><Plus size={18}/>{active === "Templates" ? "Créer un template" : "Commencer avec une image"}</button>
        </section> : <>
        <section className="welcome"><div><span className="eyebrow"><Sparkles size={14}/> BONJOUR ALEX</span><h1>Prêt à créer<br/><em>quelque chose d’impactant ?</em></h1><p>Transformez vos photos produits en contenus qui captent l’attention.</p><div className="welcome-actions"><button className="primary" onClick={() => openModule("Templates")}><WandSparkles size={19}/>Créer un visuel</button><button className="secondary" onClick={() => openModule("Produits")}><Upload size={19}/>Importer des produits</button></div></div><div className="bee-zone"><div className="pixel p1"/><div className="pixel p2"/><div className="pixel p3"/><Bee/></div></section>

        <section className="stats">
          <article><div className="stat-icon yellow"><Image size={21}/></div><div><small>Visuels créés</small><strong>1 248</strong><span>↗ 12% ce mois</span></div></article>
          <article><div className="stat-icon dark"><Box size={21}/></div><div><small>Produits</small><strong>386</strong><span>+24 cette semaine</span></div></article>
          <article><div className="stat-icon dark"><Palette size={21}/></div><div><small>Brand Kits</small><strong>4</strong><span>Actifs</span></div></article>
          <article><div className="stat-icon dark"><Clock3 size={21}/></div><div><small>Temps économisé</small><strong>42h</strong><span>Ce mois-ci</span></div></article>
        </section>

        <div className="section-title"><div><h2>Projets récents</h2><p>Reprenez là où vous vous êtes arrêté.</p></div><button onClick={() => action("Tous les projets")}>Voir tous les projets <span>→</span></button></div>
        <section className="projects">
          <button className="create-card" onClick={() => openModule("Templates")}><div><Plus size={25}/></div><strong>Nouveau projet</strong><span>Commencer une nouvelle création</span></button>
          {projects.map((p, i) => <article className="project" key={p.name}><div className={`thumb ${p.color}`}><span className="mock-logo">{i === 0 ? "SOLEIL" : i === 1 ? "NOVA" : "FORM"}</span><b>{i === 0 ? "SUMMER" : i === 1 ? "–50%" : "NEW"}</b><div className="product-shape"/></div><div className="project-info"><div><strong>{p.name}</strong><span>{p.meta}</span></div><i className={p.status === "72%" ? "progress" : "done"}>{p.status}</i></div></article>)}
        </section>

        <section className="assistant"><div className="mini-bee"><Bee small/></div><div><span>ASSISTANT CRÉATIF</span><h3>Besoin d’un coup de pouce ?</h3><p>Beezy peut vous aider à créer une accroche, choisir vos couleurs ou composer votre visuel.</p></div><button onClick={() => action("Assistant Beezy")}><Sparkles size={17}/>Demander à Beezy</button></section>
        </>}
      </div>
    </main>
    {notice && <div className="toast">{notice}</div>}
  </div>;
}
