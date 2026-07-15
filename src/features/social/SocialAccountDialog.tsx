import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { SOCIAL_PLATFORMS, type SocialAccountRecord, type SocialPlatform } from "../../types/social";
import { validateSocialAccountInput, type SocialAccountFormValue } from "./socialValidation";
import { PLATFORM_LABELS } from "./socialUi";

const empty = (platform: SocialPlatform): SocialAccountFormValue => ({ platform, displayName: "", username: "", profileUrl: "", accountType: "", notes: "" });

export function SocialAccountDialog({
  account,
  initialPlatform,
  onClose,
  onSave,
  onValidationError,
}: {
  account?: SocialAccountRecord;
  initialPlatform: SocialPlatform;
  onClose: () => void;
  onSave: (value: SocialAccountFormValue) => Promise<void>;
  onValidationError: (message: string) => void;
}) {
  const [value, setValue] = useState<SocialAccountFormValue>(() =>
    account
      ? {
          platform: account.platform,
          displayName: account.displayName,
          username: account.username || "",
          profileUrl: account.profileUrl || "",
          accountType: account.accountType || "",
          notes: account.notes || "",
        }
      : empty(initialPlatform),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof SocialAccountFormValue, string>>>({});
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    titleRef.current?.focus();
    const keydown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateSocialAccountInput(value);
    if (!result.success) {
      setErrors(result.errors);
      onValidationError(result.errors.profileUrl || "Corrigez les champs signalés avant d’enregistrer.");
      return;
    }
    setSaving(true);
    try {
      await onSave(result.value);
    } finally {
      setSaving(false);
    }
  };
  const field = (key: keyof SocialAccountFormValue, next: string) => {
    setValue((current) => ({ ...current, [key]: next }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  return (
    <div className="social-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="social-dialog" role="dialog" aria-modal="true" aria-labelledby="social-dialog-title">
        <div className="social-dialog-heading">
          <div>
            <span>PROFIL LOCAL</span>
            <h2 id="social-dialog-title" ref={titleRef} tabIndex={-1}>
              {account ? "Modifier le profil" : "Ajouter un réseau"}
            </h2>
          </div>
          <button aria-label="Fermer le dialogue" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <p className="social-dialog-warning">Ne saisissez jamais de mot de passe, jeton d’accès ou clé secrète. Aucune connexion à la plateforme n’est effectuée.</p>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Plateforme <b>*</b>
            <select value={value.platform} onChange={(event) => field("platform", event.target.value)} aria-invalid={Boolean(errors.platform)}>
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
            {errors.platform && <small role="alert">{errors.platform}</small>}
          </label>
          <label>
            Nom public <b>*</b>
            <input
              autoComplete="off"
              maxLength={101}
              value={value.displayName}
              onChange={(event) => field("displayName", event.target.value)}
              aria-invalid={Boolean(errors.displayName)}
            />
            {errors.displayName && <small role="alert">{errors.displayName}</small>}
          </label>
          <label>
            Nom d’utilisateur ou identifiant public
            <input autoComplete="off" maxLength={101} value={value.username} onChange={(event) => field("username", event.target.value)} aria-invalid={Boolean(errors.username)} />
            {errors.username && <small role="alert">{errors.username}</small>}
          </label>
          <label>
            URL HTTPS du profil
            <input
              type="url"
              inputMode="url"
              placeholder={`https://${value.platform}.com/...`}
              maxLength={501}
              value={value.profileUrl}
              onChange={(event) => field("profileUrl", event.target.value)}
              aria-invalid={Boolean(errors.profileUrl)}
            />
            {errors.profileUrl && <small role="alert">{errors.profileUrl}</small>}
          </label>
          <label>
            Type de compte <span>facultatif</span>
            <input
              autoComplete="off"
              maxLength={81}
              value={value.accountType}
              onChange={(event) => field("accountType", event.target.value)}
              aria-invalid={Boolean(errors.accountType)}
            />
            {errors.accountType && <small role="alert">{errors.accountType}</small>}
          </label>
          <label>
            Notes <span>facultatif</span>
            <textarea maxLength={501} value={value.notes} onChange={(event) => field("notes", event.target.value)} aria-invalid={Boolean(errors.notes)} />
            {errors.notes && <small role="alert">{errors.notes}</small>}
          </label>
          <div className="social-dialog-actions">
            <button type="button" className="outline" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
