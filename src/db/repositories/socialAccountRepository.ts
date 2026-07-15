import { db } from "../database";
import { storageError } from "../errors";
import type { SocialAccountRecord, SocialPlatform } from "../../types/social";

export class SocialAccountDuplicateError extends Error {
  constructor() {
    super("Cette plateforme est déjà associée à ce Brand Kit.");
    this.name = "SocialAccountDuplicateError";
  }
}

const duplicate = (error: unknown) => error instanceof Error && error.name === "ConstraintError";

export const socialAccountRepository = {
  listByBrandKitId: (brandKitId: string) => db.socialAccounts.where("brandKitId").equals(brandKitId).sortBy("platform"),
  getById: (id: string) => db.socialAccounts.get(id),
  findByBrandKitAndPlatform: (brandKitId: string, platform: SocialPlatform) => db.socialAccounts.where("[brandKitId+platform]").equals([brandKitId, platform]).first(),
  countByBrandKitId: (brandKitId: string) => db.socialAccounts.where("brandKitId").equals(brandKitId).count(),
  create: async (record: SocialAccountRecord) => {
    try {
      if (await db.socialAccounts.where("[brandKitId+platform]").equals([record.brandKitId, record.platform]).first()) throw new SocialAccountDuplicateError();
      await db.socialAccounts.add(record);
      return record;
    } catch (error) {
      if (error instanceof SocialAccountDuplicateError || duplicate(error)) throw new SocialAccountDuplicateError();
      throw storageError(error, "l’ajout du profil social");
    }
  },
  update: async (record: SocialAccountRecord) => {
    try {
      const conflict = await db.socialAccounts.where("[brandKitId+platform]").equals([record.brandKitId, record.platform]).first();
      if (conflict && conflict.id !== record.id) throw new SocialAccountDuplicateError();
      await db.socialAccounts.put(record);
      return record;
    } catch (error) {
      if (error instanceof SocialAccountDuplicateError || duplicate(error)) throw new SocialAccountDuplicateError();
      throw storageError(error, "la modification du profil social");
    }
  },
  delete: async (id: string) => {
    try {
      await db.transaction("rw", [db.socialAccounts, db.socialMetricSnapshots, db.socialPosts, db.socialPostMetricSnapshots], async () => {
        const postIds = (await db.socialPosts.where("socialAccountId").equals(id).primaryKeys()) as string[];
        if (postIds.length) await db.socialPostMetricSnapshots.where("socialPostId").anyOf(postIds).delete();
        await db.socialPosts.where("socialAccountId").equals(id).delete();
        await db.socialMetricSnapshots.where("socialAccountId").equals(id).delete();
        await db.socialAccounts.delete(id);
      });
    } catch (error) {
      throw storageError(error, "la suppression du profil social");
    }
  },
};
