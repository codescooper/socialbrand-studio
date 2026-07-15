import type { SocialConnectionStatus, SocialPlatform } from "../../types/social";

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};
export const PLATFORM_MARKS: Record<SocialPlatform, string> = { facebook: "f", instagram: "◎", tiktok: "♪", linkedin: "in" };
export const STATUS_LABELS: Record<SocialConnectionStatus, string> = {
  manual: "Profil manuel — statistiques non synchronisées",
  connected: "Connecté",
  expired: "Autorisation expirée",
  permission_required: "Autorisation requise",
  error: "Erreur",
  disconnected: "Déconnecté",
};
export const formatDateTime = (value?: string) => (value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Indisponible");
export const formatMetric = (value: number | null, suffix = "") =>
  value === null ? "Données indisponibles" : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
