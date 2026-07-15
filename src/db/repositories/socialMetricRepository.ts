import Dexie from "dexie";
import { db } from "../database";
import { storageError } from "../errors";
import type { SocialMetricSnapshotRecord } from "../../types/social";

export const socialMetricRepository = {
  listByAccountId: (socialAccountId: string) => db.socialMetricSnapshots.where("socialAccountId").equals(socialAccountId).sortBy("capturedAt"),
  getLatestByAccountId: (socialAccountId: string) =>
    db.socialMetricSnapshots.where("[socialAccountId+capturedAt]").between([socialAccountId, Dexie.minKey], [socialAccountId, Dexie.maxKey]).last(),
  listByPeriod: (socialAccountId: string, start: string, end: string) =>
    db.socialMetricSnapshots.where("[socialAccountId+capturedAt]").between([socialAccountId, start], [socialAccountId, end], true, true).toArray(),
  create: async (record: SocialMetricSnapshotRecord) => {
    try {
      await db.socialMetricSnapshots.add(record);
      return record;
    } catch (error) {
      throw storageError(error, "l’enregistrement des métriques sociales");
    }
  },
  deleteByAccountId: (socialAccountId: string) => db.socialMetricSnapshots.where("socialAccountId").equals(socialAccountId).delete(),
};
