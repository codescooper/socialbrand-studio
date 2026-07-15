import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db, SocialBrandDatabase } from "./database";
import { socialAccountRepository, SocialAccountDuplicateError } from "./repositories/socialAccountRepository";
import { socialMetricRepository } from "./repositories/socialMetricRepository";
import { socialPostRepository } from "./repositories/socialPostRepository";
import type { SocialAccountRecord, SocialPlatform } from "../types/social";
import { DEFAULT_BRAND_KIT } from "../constants/brandKitDefaults";

const account = (brandKitId: string, platform: SocialPlatform, id: string = crypto.randomUUID()): SocialAccountRecord => {
  const now = new Date().toISOString();
  return {
    id,
    version: 1,
    brandKitId,
    platform,
    displayName: `${platform} public`,
    username: platform,
    connectionMode: "manual",
    connectionStatus: "manual",
    grantedScopes: [],
    createdAt: now,
    updatedAt: now,
  };
};

beforeEach(async () => {
  await db.delete();
  await db.open();
});
afterEach(async () => {
  await db.delete();
});

describe("repositories sociaux", () => {
  it("crée, lit et met à jour un compte", async () => {
    const created = await socialAccountRepository.create(account("kit-a", "facebook", "account-a"));
    expect((await socialAccountRepository.getById(created.id))?.displayName).toBe("facebook public");
    await socialAccountRepository.update({ ...created, displayName: "Nouveau nom", updatedAt: new Date().toISOString() });
    expect((await socialAccountRepository.listByBrandKitId("kit-a"))[0].displayName).toBe("Nouveau nom");
  });
  it("isole les comptes entre deux Brand Kits", async () => {
    await socialAccountRepository.create(account("kit-a", "facebook"));
    await socialAccountRepository.create(account("kit-b", "tiktok"));
    expect(await socialAccountRepository.countByBrandKitId("kit-a")).toBe(1);
    expect((await socialAccountRepository.listByBrandKitId("kit-b"))[0].platform).toBe("tiktok");
  });
  it("refuse une deuxième plateforme principale pour le même Brand Kit", async () => {
    await socialAccountRepository.create(account("kit-a", "facebook"));
    await expect(socialAccountRepository.create(account("kit-a", "facebook"))).rejects.toBeInstanceOf(SocialAccountDuplicateError);
    await expect(socialAccountRepository.create(account("kit-b", "facebook"))).resolves.toBeTruthy();
  });
  it("supprime transactionnellement toutes les données enfants", async () => {
    const created = await socialAccountRepository.create(account("kit-a", "instagram", "account-delete"));
    await socialMetricRepository.create({
      id: "metric-delete",
      version: 1,
      socialAccountId: created.id,
      capturedAt: new Date().toISOString(),
      metrics: { followers: 10 },
      sourceMetrics: {},
      source: "api",
    });
    const post = await socialPostRepository.upsert({
      id: "post-delete",
      version: 1,
      socialAccountId: created.id,
      externalPostId: "external-delete",
      platform: "instagram",
      hashtags: [],
      fetchedAt: new Date().toISOString(),
    });
    await db.socialPostMetricSnapshots.add({
      id: "post-metric-delete",
      version: 1,
      socialPostId: post.id,
      capturedAt: new Date().toISOString(),
      metrics: { likes: 2 },
      sourceMetrics: {},
    });
    await socialAccountRepository.delete(created.id);
    expect(await db.socialAccounts.count()).toBe(0);
    expect(await db.socialMetricSnapshots.count()).toBe(0);
    expect(await db.socialPosts.count()).toBe(0);
    expect(await db.socialPostMetricSnapshots.count()).toBe(0);
  });
  it("upsert une publication par identifiant externe", async () => {
    const first = await socialPostRepository.upsert({
      id: "post-one",
      version: 1,
      socialAccountId: "account-one",
      externalPostId: "external-one",
      platform: "linkedin",
      caption: "Avant",
      hashtags: [],
      fetchedAt: new Date().toISOString(),
    });
    const second = await socialPostRepository.upsert({ ...first, id: "ignored", caption: "Après" });
    expect(second.id).toBe(first.id);
    expect((await socialPostRepository.getByExternalId("account-one", "external-one"))?.caption).toBe("Après");
  });
});

describe("migration Dexie v1 vers v2", () => {
  it("préserve les données existantes et crée des tables sociales vides de façon idempotente", async () => {
    const name = `socialbrand-migration-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(1).stores({
      brandKits: "id, name, updatedAt",
      projects: "id, name, brandKitId, updatedAt, lastOpenedAt",
      exports: "id, projectId, batchJobId, status, exportedAt, filename",
      batches: "id, finishedAt, cancelled",
      settings: "key, updatedAt",
      assets: "id, type, lastUsedAt",
    });
    await legacy.open();
    const now = new Date().toISOString();
    await legacy.table("brandKits").add({ id: DEFAULT_BRAND_KIT.id, version: 1, name: DEFAULT_BRAND_KIT.brandName, content: DEFAULT_BRAND_KIT, createdAt: now, updatedAt: now });
    legacy.close();
    const migrated = new SocialBrandDatabase(name);
    await migrated.open();
    expect(await migrated.brandKits.count()).toBe(1);
    expect(await migrated.socialAccounts.count()).toBe(0);
    migrated.close();
    await migrated.open();
    expect(await migrated.brandKits.count()).toBe(1);
    await migrated.delete();
  });
});
