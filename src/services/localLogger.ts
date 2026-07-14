export type SafeLogLevel = "info" | "warning" | "error";
export type SafeLogEntry = { at: string; level: SafeLogLevel; event: string; data?: Record<string, number | boolean> };
const KEY = "sbs-diagnostic-log-v1";
const LIMIT = 100;
export function logLocalEvent(level: SafeLogLevel, event: string, data?: Record<string, number | boolean>, storage: Pick<Storage, "getItem" | "setItem"> = localStorage) {
  try {
    const previous = JSON.parse(storage.getItem(KEY) || "[]") as SafeLogEntry[];
    const next = [...(Array.isArray(previous) ? previous : []), { at: new Date().toISOString(), level, event, data }].slice(-LIMIT);
    storage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Le journal ne doit jamais interrompre une action utilisateur.
  }
}
export function readLocalLog(storage: Pick<Storage, "getItem"> = localStorage): SafeLogEntry[] {
  try {
    const value = JSON.parse(storage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.slice(-LIMIT) : [];
  } catch {
    return [];
  }
}
