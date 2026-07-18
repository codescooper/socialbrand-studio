import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building2, Cloud, Link2, LogOut, Mail, Plus, ShieldCheck } from "lucide-react";
import { getSupabaseClient } from "../../cloud/supabaseClient";
import type { BrandKit } from "../../types/brandKit";
import type { BusinessMembershipRecord, BusinessWorkspaceRecord } from "../../types/cloud";
import type { NotificationLevel } from "../../types/notification";
import { useAuth } from "./AuthProvider";

type CloudPageProps = { activeBrandKit: BrandKit; notify: (level: NotificationLevel, message: string, persistent?: boolean) => void };

function CloudPageContent({ activeBrandKit, notify }: CloudPageProps) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState<BusinessWorkspaceRecord[]>([]);
  const [memberships, setMemberships] = useState<BusinessMembershipRecord[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client || !auth.user) return;
    const [workspaceResult, membershipResult] = await Promise.all([
      client.from("business_workspaces").select("id,name,created_at,updated_at").order("created_at"),
      client.from("business_memberships").select("workspace_id,role").eq("user_id", auth.user.id),
    ]);
    if (workspaceResult.error || membershipResult.error) throw workspaceResult.error || membershipResult.error;
    setWorkspaces((workspaceResult.data || []).map((item) => ({ id: item.id, name: item.name, createdAt: item.created_at, updatedAt: item.updated_at })));
    setMemberships((membershipResult.data || []) as BusinessMembershipRecord[]);
  }, [auth.user]);

  useEffect(() => {
    void load().catch(() => notify("error", "Impossible de charger les espaces business.", true));
  }, [load, notify]);

  const sendLink = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await auth.signInWithEmail(email.trim());
      notify("success", "Lien de connexion envoyé. Consultez votre messagerie.");
    } catch {
      notify("error", "Le lien de connexion n’a pas pu être envoyé.", true);
    } finally {
      setBusy(false);
    }
  };

  const invokeWorkspace = async (action: "create" | "link_brand_kit", input: Record<string, string>) => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Cloud indisponible");
    const { error } = await client.functions.invoke("business-workspaces", { body: { action, ...input } });
    if (error) throw error;
  };

  const createWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspaceName.trim()) return;
    setBusy(true);
    try {
      await invokeWorkspace("create", { name: workspaceName.trim() });
      setWorkspaceName("");
      await load();
      notify("success", "Espace business créé.");
    } catch {
      notify("error", "L’espace business n’a pas pu être créé.", true);
    } finally {
      setBusy(false);
    }
  };

  const linkBrandKit = async (workspaceId: string) => {
    setBusy(true);
    try {
      await invokeWorkspace("link_brand_kit", { workspaceId, localBrandKitId: activeBrandKit.id, brandName: activeBrandKit.brandName });
      notify("success", "Brand Kit lié à l’espace business.");
    } catch {
      notify("error", "Le Brand Kit n’a pas pu être lié.", true);
    } finally {
      setBusy(false);
    }
  };

  if (!auth.configured)
    return (
      <section className="cloud-page cloud-empty">
        <Cloud size={38} />
        <h1>Cloud non configuré</h1>
        <p>Le studio local reste entièrement disponible. Configurez les deux variables publiques Supabase pour activer les comptes et espaces business.</p>
        <code>VITE_SUPABASE_URL · VITE_SUPABASE_PUBLISHABLE_KEY</code>
      </section>
    );

  if (auth.loading)
    return (
      <section className="cloud-page" aria-live="polite">
        Vérification de la session…
      </section>
    );

  if (!auth.user)
    return (
      <section className="cloud-page cloud-auth-card">
        <Mail size={34} />
        <h1>Connexion sécurisée</h1>
        <p>Recevez un lien de connexion à usage unique. SocialBrand Studio ne stocke aucun mot de passe.</p>
        <form onSubmit={(event) => void sendLink(event)}>
          <label htmlFor="cloud-email">Adresse e-mail</label>
          <input id="cloud-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <button className="primary" disabled={busy}>
            {busy ? "Envoi…" : "Recevoir le lien"}
          </button>
        </form>
      </section>
    );

  return (
    <section className="cloud-page">
      <div className="cloud-heading">
        <div>
          <span className="eyebrow dark-label">
            <ShieldCheck size={14} /> ESPACE SÉCURISÉ
          </span>
          <h1>Espaces business</h1>
          <p>Connecté avec {auth.user.email || "un compte authentifié"}</p>
        </div>
        <button className="outline" onClick={() => void auth.signOut()}>
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
      <form className="cloud-create" onSubmit={(event) => void createWorkspace(event)}>
        <label htmlFor="workspace-name">Nom du nouvel espace</label>
        <div>
          <input id="workspace-name" maxLength={100} required value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
          <button className="primary" disabled={busy}>
            <Plus size={16} /> Créer
          </button>
        </div>
      </form>
      <div className="cloud-workspace-grid">
        {workspaces.map((workspace) => (
          <article key={workspace.id}>
            <Building2 size={24} />
            <h2>{workspace.name}</h2>
            <p>Rôle : {memberships.find((item) => item.workspace_id === workspace.id)?.role || "membre"}</p>
            <button className="outline" disabled={busy} onClick={() => void linkBrandKit(workspace.id)}>
              <Link2 size={16} /> Lier {activeBrandKit.brandName}
            </button>
          </article>
        ))}
        {!workspaces.length && <p className="cloud-no-workspace">Aucun espace. Créez le premier espace de votre activité.</p>}
      </div>
    </section>
  );
}

export function CloudPage(props: CloudPageProps) {
  return <CloudPageContent {...props} />;
}
