export type SocialFormat = { label: string; width: number; height: number };

export const SOCIAL_FORMATS: Record<string, SocialFormat> = {
  instagram_post: { label: "Instagram — Post carré", width: 1080, height: 1080 },
  instagram_portrait: { label: "Instagram — Portrait", width: 1080, height: 1350 },
  instagram_story: { label: "Instagram — Story / Reel", width: 1080, height: 1920 },
  facebook_post: { label: "Facebook — Publication", width: 1200, height: 630 },
  linkedin_post: { label: "LinkedIn — Publication", width: 1200, height: 627 },
  tiktok: { label: "TikTok — Vidéo verticale", width: 1080, height: 1920 },
  pinterest: { label: "Pinterest — Épingle", width: 1000, height: 1500 },
  whatsapp: { label: "WhatsApp — Catalogue", width: 1080, height: 1080 },
};
