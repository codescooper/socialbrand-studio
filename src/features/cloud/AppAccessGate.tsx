import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Building2, Cloud, ImagePlus, LockKeyhole, LogOut, Mail, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { getSupabaseClient } from "../../cloud/supabaseClient";
import { DEFAULT_BRAND_KIT } from "../../constants/brandKitDefaults";
import { brandKitRepository } from "../../db/repositories";
import { setOnboardingComplete } from "../../services/appSettings";
import type { BrandKit } from "../../types/brandKit";
import { useAuth } from "./AuthProvider";

const LOCAL_SESSION_KEY = "socialbrand-local-session";
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

type WorkspaceAccess = {
  status: "idle" | "loading" | "setup" | "ready" | "error";
  workspaceId?: string;
};

function AccessBrand() {
  return (
    <div className="access-brand" aria-label="SocialBrand Studio">
      <div className="access-brand-mark" aria-hidden="true">
        <span className="access-wing left" />
        <span className="access-bee-body">
          <i />
          <i />
        </span>
        <span className="access-wing right" />
      </div>
      <div>
        <strong>SocialBrand</strong>
        <small>STUDIO</small>
      </div>
    </div>
  );
}

function AccessWelcome({ onLocal }: { onLocal: () => void }) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth.configured) return;
    setBusy(true);
    setError("");
    try {
      await auth.signInWithEmail(email.trim());
      setSent(true);
    } catch {
      setError("Le lien n’a pas pu être envoyé. Vérifiez l’adresse et réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="access-page">
      <section className="access-hero">
        <AccessBrand />
        <div className="access-hero-copy">
          <span className="access-kicker">
            <Sparkles size={15} /> VOTRE STUDIO DE MARQUE
          </span>
          <h1>
            Une marque cohérente,
            <em> sur chaque visuel.</em>
          </h1>
          <p>Centralisez vos Brand Kits, préparez vos contenus produits et exportez les bons formats pour chaque réseau social.</p>
          <ul>
            <li>
              <ShieldCheck size={18} /> Espaces business sécurisés
            </li>
            <li>
              <Palette size={18} /> Identité de marque réutilisable
            </li>
            <li>
              <ImagePlus size={18} /> Aperçu fidèle à l’export
            </li>
          </ul>
        </div>
        <p className="access-hero-note">Conçu par AWEMA · PWA installable</p>
      </section>

      <section className="access-panel" aria-labelledby="access-title">
        <div className="access-panel-inner">
          <span className="access-secure-icon">
            <LockKeyhole />
          </span>
          <span className="access-step">ACCÈS SÉCURISÉ</span>
          <h2 id="access-title">Bienvenue dans votre studio</h2>
          <p>Connectez-vous avec votre e-mail. Aucun mot de passe à retenir.</p>

          {sent ? (
            <div className="access-message success" role="status">
              <Mail size={22} />
              <div>
                <strong>Consultez votre messagerie</strong>
                <span>Nous avons envoyé un lien de connexion à {email}.</span>
              </div>
              <button className="text-button" onClick={() => setSent(false)}>
                Utiliser une autre adresse
              </button>
            </div>
          ) : (
            <form className="access-form" onSubmit={(event) => void submit(event)}>
              <label htmlFor="access-email">Adresse e-mail professionnelle</label>
              <div className="access-input-wrap">
                <Mail size={18} />
                <input
                  id="access-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.com"
                  required
                  disabled={!auth.configured || busy}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {error && (
                <p className="access-error" role="alert">
                  {error}
                </p>
              )}
              {!auth.configured && <p className="access-error">Le service cloud n’est pas configuré sur cette installation.</p>}
              <button className="primary access-submit" disabled={!auth.configured || busy}>
                {busy ? "Envoi en cours…" : "Recevoir mon lien de connexion"} {!busy && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          <div className="access-divider">
            <span>ou</span>
          </div>
          <button className="outline access-local" onClick={onLocal}>
            <Cloud size={18} /> Essayer en local sans compte
          </button>
          <small className="access-privacy">Le mode local conserve les données uniquement sur cet appareil et reste actif pour cette session.</small>
        </div>
      </section>
    </main>
  );
}

function readLogo(file?: File) {
  if (!file) return Promise.resolve("");
  if (!ACCEPTED_LOGO_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024) return Promise.reject(new Error("invalid-logo"));
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("unreadable-logo"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function WorkspaceSetup({ workspaceId, onComplete }: { workspaceId?: string; onComplete: () => Promise<void> }) {
  const auth = useAuth();
  const [workspaceName, setWorkspaceName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [contact, setContact] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#FFD600");
  const [secondaryColor, setSecondaryColor] = useState("#111111");
  const [logoFile, setLogoFile] = useState<File>();
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState(workspaceId);
  const [brandKitId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setBusy(true);
    setError("");
    try {
      const logo = await readLogo(logoFile);
      const brandKit: BrandKit = {
        ...DEFAULT_BRAND_KIT,
        id: brandKitId,
        brandName: brandName.trim(),
        contact: contact.trim() || DEFAULT_BRAND_KIT.contact,
        primaryColor,
        secondaryColor,
        logo,
        template: { ...DEFAULT_BRAND_KIT.template },
      };
      const now = new Date().toISOString();
      await brandKitRepository.update({ id: brandKit.id, version: 1, name: brandKit.brandName, content: brandKit, createdAt: now, updatedAt: now });

      let targetWorkspaceId = createdWorkspaceId;
      if (!targetWorkspaceId) {
        const { data, error: createError } = await client.functions.invoke<{ workspaceId: string }>("business-workspaces", {
          body: { action: "create", name: workspaceName.trim() },
        });
        if (createError || !data?.workspaceId) throw createError || new Error("workspace-not-created");
        targetWorkspaceId = data.workspaceId;
        setCreatedWorkspaceId(targetWorkspaceId);
      }

      const { error: linkError } = await client.functions.invoke("business-workspaces", {
        body: { action: "link_brand_kit", workspaceId: targetWorkspaceId, localBrandKitId: brandKit.id, brandName: brandKit.brandName },
      });
      if (linkError) throw linkError;
      await setOnboardingComplete(true);
      await onComplete();
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message === "invalid-logo"
          ? "Logo non valide : utilisez PNG, JPG, WEBP ou SVG, 5 Mo maximum."
          : "La configuration n’a pas pu être terminée. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onLogoChange = (event: ChangeEvent<HTMLInputElement>) => setLogoFile(event.currentTarget.files?.[0]);

  return (
    <main className="setup-page">
      <header className="setup-header">
        <AccessBrand />
        <button className="text-button" onClick={() => void auth.signOut()}>
          <LogOut size={16} /> Se déconnecter
        </button>
      </header>
      <section className="setup-layout">
        <div className="setup-intro">
          <span className="access-kicker">
            <Sparkles size={15} /> CONFIGURATION INITIALE
          </span>
          <h1>Préparons votre espace de marque.</h1>
          <p>Ces informations créent votre espace sécurisé et votre premier Brand Kit. Vous pourrez tout modifier ensuite.</p>
          <ol>
            <li className="done">
              <span>1</span>
              <div>
                <strong>Compte sécurisé</strong>
                <small>{auth.user?.email}</small>
              </div>
            </li>
            <li className={workspaceId ? "done" : "active"}>
              <span>2</span>
              <div>
                <strong>Espace business</strong>
                <small>{workspaceId ? "Espace existant détecté" : "Identifiez votre structure"}</small>
              </div>
            </li>
            <li className={workspaceId ? "active" : ""}>
              <span>3</span>
              <div>
                <strong>Premier Brand Kit</strong>
                <small>Nom, couleurs, contact et logo</small>
              </div>
            </li>
          </ol>
        </div>

        <form className="setup-card" onSubmit={(event) => void submit(event)}>
          <span className="setup-card-icon">{workspaceId ? <Palette /> : <Building2 />}</span>
          <h2>{workspaceId ? "Créez votre premier Brand Kit" : "Parlez-nous de votre activité"}</h2>
          <p>Les champs marqués sont nécessaires pour ouvrir votre tableau de bord.</p>
          {!workspaceId && (
            <label>
              Nom de la structure *
              <input required maxLength={100} placeholder="AWEMA" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
            </label>
          )}
          <label>
            Nom de la marque *
            <input required maxLength={100} placeholder="Ma marque" value={brandName} onChange={(event) => setBrandName(event.target.value)} />
          </label>
          <label>
            Contact affiché sur les visuels
            <input maxLength={100} placeholder="+225 00 00 00 00 00" value={contact} onChange={(event) => setContact(event.target.value)} />
          </label>
          <div className="setup-colors">
            <label>
              Couleur principale
              <span>
                <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
                <input aria-label="Code couleur principale" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
              </span>
            </label>
            <label>
              Couleur secondaire
              <span>
                <input type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} />
                <input aria-label="Code couleur secondaire" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} />
              </span>
            </label>
          </div>
          <label className="setup-logo">
            Logo de la marque <small>Optionnel · PNG, JPG, WEBP ou SVG</small>
            <span>
              <ImagePlus size={20} /> {logoFile?.name || "Choisir un logo"}
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogoChange} />
          </label>
          {error && (
            <p className="access-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary setup-submit" disabled={busy}>
            {busy ? "Configuration en cours…" : "Créer mon espace et continuer"} {!busy && <ArrowRight size={18} />}
          </button>
        </form>
      </section>
    </main>
  );
}

export function AppAccessGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [localMode, setLocalMode] = useState(() => typeof window !== "undefined" && window.sessionStorage.getItem(LOCAL_SESSION_KEY) === "true");
  const [access, setAccess] = useState<WorkspaceAccess>({ status: "idle" });

  const inspectWorkspace = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client || !auth.user) return;
    setAccess((current) => ({ ...current, status: "loading" }));
    const [workspaceResult, linkResult] = await Promise.all([
      client.from("business_workspaces").select("id").order("created_at").limit(1).maybeSingle(),
      client.from("brand_kit_links").select("id,workspace_id").limit(1),
    ]);
    if (workspaceResult.error || linkResult.error) {
      setAccess({ status: "error" });
      return;
    }
    const workspaceId = workspaceResult.data?.id;
    setAccess({ status: workspaceId && (linkResult.data?.length || 0) > 0 ? "ready" : "setup", workspaceId });
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user) {
      setAccess({ status: "idle" });
      return;
    }
    void inspectWorkspace();
  }, [auth.user, inspectWorkspace]);

  const enableLocalMode = () => {
    window.sessionStorage.setItem(LOCAL_SESSION_KEY, "true");
    setLocalMode(true);
  };

  if (auth.loading)
    return (
      <main className="access-loading" aria-live="polite">
        <AccessBrand />
        <span className="access-spinner" />
        <p>Vérification de votre session…</p>
      </main>
    );
  if (!auth.user && !localMode) return <AccessWelcome onLocal={enableLocalMode} />;
  if (!auth.user && localMode) return <>{children}</>;
  if (access.status === "loading" || access.status === "idle")
    return (
      <main className="access-loading" aria-live="polite">
        <AccessBrand />
        <span className="access-spinner" />
        <p>Préparation de votre espace…</p>
      </main>
    );
  if (access.status === "error")
    return (
      <main className="access-loading">
        <AccessBrand />
        <p>Impossible de vérifier votre espace business.</p>
        <button className="primary" onClick={() => void inspectWorkspace()}>
          Réessayer
        </button>
        <button className="text-button" onClick={() => void auth.signOut()}>
          Se déconnecter
        </button>
      </main>
    );
  if (access.status === "setup") return <WorkspaceSetup workspaceId={access.workspaceId} onComplete={inspectWorkspace} />;
  return <>{children}</>;
}
