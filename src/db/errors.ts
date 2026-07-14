export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: "unavailable" | "quota" | "transaction" | "invalid-backup" | "unsupported-version",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "StorageError";
  }
}
export function storageError(error: unknown, action: string) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError")
    return new StorageError(`Espace insuffisant pendant ${action}. Les données existantes sont conservées. Libérez de l’espace puis réessayez.`, "quota", { cause: error });
  return new StorageError(`Échec du stockage pendant ${action}. Les données confirmées auparavant sont conservées. Réessayez.`, "transaction", { cause: error });
}
