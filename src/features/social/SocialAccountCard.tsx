import { Edit3, Plus, Trash2 } from "lucide-react";
import type { SocialAccountRecord, SocialPlatform } from "../../types/social";
import { formatDateTime, PLATFORM_LABELS, PLATFORM_MARKS, STATUS_LABELS } from "./socialUi";

export function SocialAccountCard({
  platform,
  account,
  onAdd,
  onEdit,
  onDelete,
}: {
  platform: SocialPlatform;
  account?: SocialAccountRecord;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={`social-account-card social-${platform}`} aria-labelledby={`social-${platform}-title`}>
      <div className="social-card-heading">
        <span className="social-platform-mark" aria-hidden="true">
          {PLATFORM_MARKS[platform]}
        </span>
        <div>
          <h3 id={`social-${platform}-title`}>{PLATFORM_LABELS[platform]}</h3>
          <span>{account ? STATUS_LABELS[account.connectionStatus] : "Aucun profil associé"}</span>
        </div>
      </div>
      {account ? (
        <>
          <dl>
            <div>
              <dt>Nom public</dt>
              <dd>{account.displayName}</dd>
            </div>
            <div>
              <dt>Identifiant</dt>
              <dd>{account.username ? `@${account.username}` : "Indisponible"}</dd>
            </div>
            <div>
              <dt>URL</dt>
              <dd className="social-url">{account.profileUrl || "Indisponible"}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{account.connectionMode === "manual" ? "Profil manuel" : "API"}</dd>
            </div>
            <div>
              <dt>Modification</dt>
              <dd>{formatDateTime(account.updatedAt)}</dd>
            </div>
            <div>
              <dt>Synchronisation</dt>
              <dd>{formatDateTime(account.lastSyncedAt)}</dd>
            </div>
          </dl>
          <button className="social-api-button" disabled title="Connexion API bientôt disponible">
            Connexion API bientôt disponible
          </button>
          <div className="social-card-actions">
            <button className="outline" onClick={onEdit}>
              <Edit3 size={15} /> Modifier
            </button>
            <button className="danger-outline" onClick={onDelete}>
              <Trash2 size={15} /> Supprimer
            </button>
          </div>
        </>
      ) : (
        <div className="social-empty-card">
          <p>Ajoutez les informations publiques du profil. Aucune statistique ne sera récupérée.</p>
          <button className="outline" onClick={onAdd}>
            <Plus size={16} /> Ajouter {PLATFORM_LABELS[platform]}
          </button>
          <button className="social-api-button" disabled title="Connexion API bientôt disponible">
            Connexion API bientôt disponible
          </button>
        </div>
      )}
    </article>
  );
}
