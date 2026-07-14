import { DEFAULT_BRAND_KIT } from "../constants/brandKitDefaults";
import { validateBrandKitImport } from "../services/brandKitValidation";
import type { BrandKit } from "../types/brandKit";
import type { BrandKitRecord } from "../types/persistence";
import { db } from "./database";

export type MigrationReport = { migrated: number; repaired: number; ignored: number };
const LEGACY_KEYS = ["sbs-brand-kits", "sbs-brand-kit"];
const record = (kit: BrandKit, createdAt = new Date().toISOString()): BrandKitRecord => ({
  id: kit.id,
  version: 1,
  name: kit.brandName,
  content: kit,
  createdAt,
  updatedAt: createdAt,
});
export async function initializePersistence(storage: Pick<Storage, "getItem" | "setItem"> = localStorage): Promise<MigrationReport> {
  const report = { migrated: 0, repaired: 0, ignored: 0 };
  await db.transaction("rw", db.brandKits, db.settings, async () => {
    const done = await db.settings.get("legacy-migration-v1");
    if (!done) {
      const seen = new Set<string>();
      for (const key of LEGACY_KEYS) {
        const raw = storage.getItem(key);
        if (!raw) continue;
        if (key === "sbs-brand-kits") {
          try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error();
            for (const item of parsed) {
              const result = validateBrandKitImport(item);
              if (!result) {
                report.ignored++;
                continue;
              }
              if (seen.has(result.brandKit.id) || (await db.brandKits.get(result.brandKit.id))) continue;
              seen.add(result.brandKit.id);
              await db.brandKits.add(record(result.brandKit));
              report.migrated++;
              if (result.repaired) report.repaired++;
            }
          } catch {
            report.ignored++;
          }
        } else {
          try {
            const result = validateBrandKitImport(JSON.parse(raw));
            if (!result) {
              report.ignored++;
              continue;
            }
            const kit = result.brandKit;
            if (seen.has(kit.id) || (await db.brandKits.get(kit.id))) continue;
            seen.add(kit.id);
            await db.brandKits.add(record(kit));
            report.migrated++;
            if (result.repaired) report.repaired++;
          } catch {
            report.ignored++;
          }
        }
      }
      await db.settings.put({ key: "legacy-migration-v1", value: report, updatedAt: new Date().toISOString() });
      storage.setItem("sbs-idb-migration-v1", "confirmed");
    }
    if ((await db.brandKits.count()) === 0) await db.brandKits.add(record({ ...DEFAULT_BRAND_KIT, template: { ...DEFAULT_BRAND_KIT.template } }));
  });
  return report;
}
