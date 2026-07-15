import { db } from "../database";
import { storageError } from "../errors";
import type { SocialPostRecord } from "../../types/social";

export const socialPostRepository = {
  listByAccountId: (socialAccountId: string) => db.socialPosts.where("socialAccountId").equals(socialAccountId).sortBy("publishedAt"),
  getByExternalId: (socialAccountId: string, externalPostId: string) => db.socialPosts.where("[socialAccountId+externalPostId]").equals([socialAccountId, externalPostId]).first(),
  upsert: async (record: SocialPostRecord) => {
    try {
      const existing = await db.socialPosts.where("[socialAccountId+externalPostId]").equals([record.socialAccountId, record.externalPostId]).first();
      const next = existing ? { ...record, id: existing.id } : record;
      await db.socialPosts.put(next);
      return next;
    } catch (error) {
      throw storageError(error, "l’enregistrement de la publication sociale");
    }
  },
  deleteByAccountId: (socialAccountId: string) => db.socialPosts.where("socialAccountId").equals(socialAccountId).delete(),
};
