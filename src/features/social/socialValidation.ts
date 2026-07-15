import { SOCIAL_PLATFORMS, type SocialPlatform } from "../../types/social";

export type SocialAccountFormValue = {
  platform: SocialPlatform;
  displayName: string;
  username: string;
  profileUrl: string;
  accountType: string;
  notes: string;
};

const DOMAINS: Record<SocialPlatform, string> = {
  facebook: "facebook.com",
  instagram: "instagram.com",
  tiktok: "tiktok.com",
  linkedin: "linkedin.com",
};
const LIMITS = { displayName: 100, username: 100, profileUrl: 500, accountType: 80, notes: 500 } as const;
const clean = (value: unknown) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "");
const unsafe = (value: string) => /[<>]/.test(value);

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && SOCIAL_PLATFORMS.includes(value as SocialPlatform);
}

export function normalizeProfileUrl(value: string) {
  if (!value) return "";
  const url = new URL(value);
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  return url.toString();
}

export function validateSocialAccountInput(
  input: Partial<Record<keyof SocialAccountFormValue, unknown>>,
): { success: true; value: SocialAccountFormValue } | { success: false; errors: Partial<Record<keyof SocialAccountFormValue, string>> } {
  const errors: Partial<Record<keyof SocialAccountFormValue, string>> = {};
  const platform = input.platform;
  const value = {
    platform: isSocialPlatform(platform) ? platform : "facebook",
    displayName: clean(input.displayName),
    username: clean(input.username).replace(/^@/, ""),
    profileUrl: clean(input.profileUrl),
    accountType: clean(input.accountType),
    notes: clean(input.notes),
  } satisfies SocialAccountFormValue;

  if (!isSocialPlatform(platform)) errors.platform = "Choisissez une plateforme prise en charge.";
  if (!value.displayName) errors.displayName = "Le nom public est obligatoire.";
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    if (value[key].length > LIMITS[key]) errors[key] = `Maximum ${LIMITS[key]} caractères.`;
    if (unsafe(value[key])) errors[key] = "Les balises HTML ne sont pas autorisées.";
  }
  if (value.profileUrl) {
    try {
      const url = new URL(value.profileUrl);
      const expected = DOMAINS[value.platform];
      const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
      if (url.protocol !== "https:") errors.profileUrl = "Utilisez une URL HTTPS.";
      else if (hostname !== expected && !hostname.endsWith(`.${expected}`)) errors.profileUrl = `Utilisez une URL ${expected}.`;
      else value.profileUrl = normalizeProfileUrl(value.profileUrl);
    } catch {
      errors.profileUrl = "L’URL du profil est invalide.";
    }
  }
  return Object.keys(errors).length ? { success: false, errors } : { success: true, value };
}
