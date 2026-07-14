import { db } from "../database";
import type { EntityTable } from "dexie";
import { storageError } from "../errors";
import type { AppSettingRecord, AssetRecord, BatchHistoryRecord, BrandKitRecord, ExportRecord, ProjectRecord } from "../../types/persistence";

function repository<T extends { id: string }>(table: EntityTable<T, "id">) {
  return {
    list: () => table.toArray(),
    getById: (id: string) => table.get(id as never),
    count: () => table.count(),
    create: async (record: T) => {
      try {
        await table.add(record as never);
        return record;
      } catch (e) {
        throw storageError(e, "la création");
      }
    },
    update: async (record: T) => {
      try {
        await table.put(record as never);
        return record;
      } catch (e) {
        throw storageError(e, "la sauvegarde");
      }
    },
    delete: (id: string) => table.delete(id as never),
    clear: () => table.clear(),
  };
}
export const brandKitRepository = { ...repository<BrandKitRecord>(db.brandKits), list: () => db.brandKits.orderBy("updatedAt").reverse().toArray() };
export const projectRepository = { ...repository<ProjectRecord>(db.projects), list: () => db.projects.orderBy("lastOpenedAt").reverse().toArray() };
export const exportRepository = { ...repository<ExportRecord>(db.exports), list: () => db.exports.orderBy("exportedAt").reverse().toArray() };
export const batchRepository = { ...repository<BatchHistoryRecord>(db.batches), list: () => db.batches.orderBy("finishedAt").reverse().toArray() };
export const assetRepository = repository<AssetRecord>(db.assets);
export const settingsRepository = {
  list: () => db.settings.toArray(),
  getById: (key: string) => db.settings.get(key),
  count: () => db.settings.count(),
  clear: () => db.settings.clear(),
  delete: (key: string) => db.settings.delete(key),
  update: async (record: AppSettingRecord) => {
    try {
      await db.settings.put(record);
      return record;
    } catch (e) {
      throw storageError(e, "les réglages");
    }
  },
};
