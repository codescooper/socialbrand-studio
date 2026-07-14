import { describe, expect, it } from "vitest";
import { logLocalEvent, readLocalLog } from "./localLogger";
class MemoryStorage {
  value = "";
  getItem() {
    return this.value || null;
  }
  setItem(_key: string, value: string) {
    this.value = value;
  }
}
describe("journal local sûr", () => {
  it("conserve au plus 100 événements sans contenu utilisateur", () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 120; index++) logLocalEvent("info", "test", { index }, storage);
    const log = readLocalLog(storage);
    expect(log).toHaveLength(100);
    expect(log[0].data?.index).toBe(20);
  });
});
