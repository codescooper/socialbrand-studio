import { describe, expect, it } from "vitest";
import { SocialConnectorUnavailableError } from "./SocialConnector";
import { UnavailableSocialConnector } from "./UnavailableSocialConnector";

describe("connecteur social indisponible", () => {
  it("échoue explicitement sans produire de données simulées", async () => {
    const connector = new UnavailableSocialConnector("facebook");
    await expect(connector.getAuthorizationUrl({ brandKitId: "kit", returnUrl: "https://example.com" })).rejects.toBeInstanceOf(SocialConnectorUnavailableError);
    await expect(connector.syncAccount("account")).rejects.toThrow("n’est pas encore disponible");
    await expect(connector.disconnect("account")).rejects.toThrow("n’est pas encore disponible");
  });
});
