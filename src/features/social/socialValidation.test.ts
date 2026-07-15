import { describe, expect, it } from "vitest";
import { normalizeProfileUrl, validateSocialAccountInput } from "./socialValidation";
import type { SocialPlatform } from "../../types/social";

const valid = (platform: SocialPlatform, profileUrl: string) =>
  validateSocialAccountInput({ platform, displayName: "  Ma marque  ", username: "  @marque  ", profileUrl, accountType: "  Business  ", notes: "  Note locale  " });

describe("validation des profils sociaux", () => {
  it("accepte les quatre plateformes et leurs domaines HTTPS", () => {
    expect(valid("facebook", "https://www.facebook.com/marque").success).toBe(true);
    expect(valid("instagram", "https://instagram.com/marque").success).toBe(true);
    expect(valid("tiktok", "https://m.tiktok.com/@marque").success).toBe(true);
    expect(valid("linkedin", "https://fr.linkedin.com/company/marque").success).toBe(true);
  });
  it("refuse une plateforme inconnue", () => {
    expect(validateSocialAccountInput({ platform: "youtube", displayName: "Marque" }).success).toBe(false);
  });
  it.each([
    ["facebook", "https://instagram.com/marque"],
    ["instagram", "http://instagram.com/marque"],
    ["tiktok", "https://fake-tiktok.com/marque"],
    ["linkedin", "texte-invalide"],
  ])("refuse une URL incohérente pour %s", (platform, profileUrl) => {
    expect(valid(platform as SocialPlatform, profileUrl).success).toBe(false);
  });
  it("normalise www, espaces et arobase", () => {
    const result = valid("facebook", "https://www.facebook.com/marque");
    expect(result.success && result.value.profileUrl).toBe("https://facebook.com/marque");
    expect(result.success && result.value.displayName).toBe("Ma marque");
    expect(result.success && result.value.username).toBe("marque");
    expect(normalizeProfileUrl("https://WWW.INSTAGRAM.COM/marque")).toBe("https://instagram.com/marque");
  });
  it("refuse un nom vide et les balises HTML", () => {
    expect(validateSocialAccountInput({ platform: "facebook", displayName: "   " }).success).toBe(false);
    expect(validateSocialAccountInput({ platform: "facebook", displayName: "<img>" }).success).toBe(false);
  });
});
