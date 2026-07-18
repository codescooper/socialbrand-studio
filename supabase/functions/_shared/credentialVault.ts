export type EncryptedCredential = {
  encryptedPayload: string;
  initializationVector: string;
  keyVersion: number;
};

const toBase64 = (value: Uint8Array) => btoa(String.fromCharCode(...value));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

async function importEncryptionKey(encodedKey: string) {
  const raw = fromBase64(encodedKey);
  if (raw.byteLength !== 32) throw new Error("credential_key_invalid");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptCredential(cleartext: string, encodedKey: string, keyVersion: number): Promise<EncryptedCredential> {
  if (!cleartext) throw new Error("credential_empty");
  const key = await importEncryptionKey(encodedKey);
  const initializationVector = crypto.getRandomValues(new Uint8Array(12));
  const payload = await crypto.subtle.encrypt({ name: "AES-GCM", iv: initializationVector }, key, new TextEncoder().encode(cleartext));
  return { encryptedPayload: toBase64(new Uint8Array(payload)), initializationVector: toBase64(initializationVector), keyVersion };
}

export async function decryptCredential(value: EncryptedCredential, encodedKey: string) {
  const key = await importEncryptionKey(encodedKey);
  const cleartext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(value.initializationVector) }, key, fromBase64(value.encryptedPayload));
  return new TextDecoder().decode(cleartext);
}
