import { describe, expect, it } from "vitest";
import { decryptCredential, encryptCredential } from "../../supabase/functions/_shared/credentialVault";

const key = (fill: number) => btoa(String.fromCharCode(...new Uint8Array(32).fill(fill)));

describe("coffre de credentials", () => {
  it("chiffre sans conserver le jeton en clair puis le déchiffre", async () => {
    const token = "synthetic-test-token-not-a-real-secret";
    const encrypted = await encryptCredential(token, key(7), 1);
    expect(encrypted.encryptedPayload).not.toContain(token);
    expect(encrypted.keyVersion).toBe(1);
    await expect(decryptCredential(encrypted, key(7))).resolves.toBe(token);
  });

  it("refuse une clé de mauvaise longueur et une mauvaise clé", async () => {
    await expect(encryptCredential("synthetic", btoa("short"), 1)).rejects.toThrow("credential_key_invalid");
    const encrypted = await encryptCredential("synthetic", key(1), 2);
    await expect(decryptCredential(encrypted, key(2))).rejects.toThrow();
  });
});
