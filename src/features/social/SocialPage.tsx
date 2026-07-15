import { useCallback, useEffect, useMemo, useState } from "react";
import { Network, Plus, ShieldCheck } from "lucide-react";
import type { BrandKit } from "../../types/brandKit";
import type { NotificationLevel } from "../../types/notification";
import { SOCIAL_PLATFORMS, type SocialAccountRecord, type SocialMetricSnapshotRecord, type SocialPlatform } from "../../types/social";
import { socialAccountRepository, SocialAccountDuplicateError } from "../../db/repositories/socialAccountRepository";
import { socialMetricRepository } from "../../db/repositories/socialMetricRepository";
import { SocialAccountCard } from "./SocialAccountCard";
import { SocialAccountDialog } from "./SocialAccountDialog";
import type { SocialAccountFormValue } from "./socialValidation";
import { SocialHealthOverview } from "./SocialHealthOverview";
import { SocialComparisonTable } from "./SocialComparisonTable";
import { SocialHealthAxes } from "./SocialHealthAxes";
import { TopContentPanel } from "./TopContentPanel";
import { formatDateTime, PLATFORM_LABELS } from "./socialUi";

type DialogState = { platform: SocialPlatform; account?: SocialAccountRecord };

export function SocialPage({
  brandKits,
  activeBrandKit,
  onBrandKitChange,
  onNotify,
}: {
  brandKits: BrandKit[];
  activeBrandKit: BrandKit;
  onBrandKitChange: (brandKit: BrandKit) => void;
  onNotify: (level: NotificationLevel, message: string, persistent?: boolean) => void;
}) {
  const [accounts, setAccounts] = useState<SocialAccountRecord[]>([]);
  const [histories, setHistories] = useState<Map<string, SocialMetricSnapshotRecord[]>>(new Map());
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [loading, setLoading] = useState(true);
  const closeDialog = useCallback(() => setDialog(null), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextAccounts = await socialAccountRepository.listByBrandKitId(activeBrandKit.id);
      const nextHistories = new Map<string, SocialMetricSnapshotRecord[]>();
      await Promise.all(
        nextAccounts.map(async (account) => {
          nextHistories.set(account.id, await socialMetricRepository.listByAccountId(account.id));
        }),
      );
      setAccounts(nextAccounts);
      setHistories(nextHistories);
    } catch {
      onNotify("error", "Impossible de charger les profils sociaux locaux.", true);
    } finally {
      setLoading(false);
    }
  }, [activeBrandKit.id, onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  const accountsByPlatform = useMemo(() => new Map(accounts.map((account) => [account.platform, account])), [accounts]);
  const lastModified = accounts.length ? accounts.reduce((latest, account) => (account.updatedAt > latest ? account.updatedAt : latest), accounts[0].updatedAt) : undefined;

  const save = async (value: SocialAccountFormValue) => {
    const now = new Date().toISOString();
    const optional = (text: string) => text || undefined;
    try {
      if (dialog?.account) {
        await socialAccountRepository.update({
          ...dialog.account,
          platform: value.platform,
          displayName: value.displayName,
          username: optional(value.username),
          profileUrl: optional(value.profileUrl),
          accountType: optional(value.accountType),
          notes: optional(value.notes),
          updatedAt: now,
        });
        onNotify("success", "Profil social modifié.");
      } else {
        await socialAccountRepository.create({
          id: crypto.randomUUID(),
          version: 1,
          brandKitId: activeBrandKit.id,
          platform: value.platform,
          displayName: value.displayName,
          username: optional(value.username),
          profileUrl: optional(value.profileUrl),
          accountType: optional(value.accountType),
          notes: optional(value.notes),
          connectionMode: "manual",
          connectionStatus: "manual",
          grantedScopes: [],
          createdAt: now,
          updatedAt: now,
        });
        onNotify("success", "Profil social ajouté.");
      }
      closeDialog();
      await load();
    } catch (error) {
      if (error instanceof SocialAccountDuplicateError) onNotify("error", "Cette plateforme est déjà associée à ce Brand Kit.", true);
      else onNotify("error", "Erreur de stockage : le profil social n’a pas été enregistré.", true);
    }
  };

  const remove = async (account: SocialAccountRecord) => {
    const confirmed = window.confirm(
      `Supprimer l’association locale ${PLATFORM_LABELS[account.platform]} de ${activeBrandKit.brandName} ? Aucun compte réel sur la plateforme ne sera supprimé.`,
    );
    if (!confirmed) {
      onNotify("warning", "Suppression annulée.");
      return;
    }
    try {
      await socialAccountRepository.delete(account.id);
      onNotify("success", "Profil social supprimé.");
      await load();
    } catch {
      onNotify("error", "Erreur de stockage : le profil social n’a pas été supprimé.", true);
    }
  };

  return (
    <section className="social-page">
      <div className="social-hero">
        <div className="social-brand-identity">
          <div className="social-brand-logo" style={{ background: activeBrandKit.primaryColor }}>
            {activeBrandKit.logo ? (
              <img src={activeBrandKit.logo} alt={`Logo de ${activeBrandKit.brandName}`} />
            ) : (
              <span>{activeBrandKit.brandName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <span className="eyebrow dark-label">
              <Network size={14} /> RÉSEAUX
            </span>
            <h1>{activeBrandKit.brandName}</h1>
            <p>Profils publics associés à ce Brand Kit. Toutes les données restent sur cet appareil.</p>
          </div>
        </div>
        <div className="social-brand-controls">
          <label htmlFor="social-brand-kit">Brand Kit actif</label>
          <select id="social-brand-kit" value={activeBrandKit.id} onChange={(event) => onBrandKitChange(brandKits.find((kit) => kit.id === event.target.value) || activeBrandKit)}>
            {brandKits.map((kit) => (
              <option value={kit.id} key={kit.id}>
                {kit.brandName}
              </option>
            ))}
          </select>
          <div className="social-brand-meta">
            <span>
              <b>{accounts.length}</b> compte{accounts.length > 1 ? "s" : ""} associé{accounts.length > 1 ? "s" : ""}
            </span>
            <span>Dernière modification : {formatDateTime(lastModified)}</span>
          </div>
        </div>
      </div>

      {!loading && accounts.length === 0 && (
        <div className="social-guided-empty" role="status">
          <ShieldCheck size={27} />
          <div>
            <h2>Associez vos profils publics</h2>
            <p>Commencez par un réseau. Aucun mot de passe, jeton ou accès à la plateforme ne vous sera demandé.</p>
          </div>
          <button className="primary" onClick={() => setDialog({ platform: "facebook" })}>
            <Plus size={16} /> Ajouter un profil
          </button>
        </div>
      )}

      <div className={`social-account-grid ${loading ? "loading" : ""}`} aria-busy={loading}>
        {SOCIAL_PLATFORMS.map((platform) => {
          const account = accountsByPlatform.get(platform);
          return (
            <SocialAccountCard
              key={platform}
              platform={platform}
              account={account}
              onAdd={() => setDialog({ platform })}
              onEdit={() => account && setDialog({ platform, account })}
              onDelete={() => account && void remove(account)}
            />
          );
        })}
      </div>

      <SocialHealthOverview accounts={accounts} histories={histories} />
      <div className="social-health-layout">
        <SocialComparisonTable accounts={accounts} histories={histories} />
        <SocialHealthAxes accounts={accounts} histories={histories} />
        <TopContentPanel />
      </div>

      {dialog && (
        <SocialAccountDialog
          account={dialog.account}
          initialPlatform={dialog.platform}
          onClose={closeDialog}
          onSave={save}
          onValidationError={(message) => onNotify("error", message, true)}
        />
      )}
    </section>
  );
}
