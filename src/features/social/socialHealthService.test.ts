import { describe, expect, it } from "vitest";
import type { SocialMetricSnapshotRecord } from "../../types/social";
import { calculateEngagementRate, compareMetric, primaryMetricForPlatform, rankPostsByMetric, sumInteractions, sumMetric } from "./socialHealthService";

const snapshot = (metrics: SocialMetricSnapshotRecord["metrics"]): SocialMetricSnapshotRecord => ({
  id: crypto.randomUUID(),
  version: 1,
  socialAccountId: "account",
  capturedAt: new Date().toISOString(),
  metrics,
  sourceMetrics: {},
  source: "api",
});

describe("calculs de santé digitale", () => {
  it("distingue une métrique absente d’un vrai zéro", () => {
    expect(sumMetric([snapshot({})], "followers")).toBeNull();
    expect(sumMetric([snapshot({ followers: 0 })], "followers")).toBe(0);
  });
  it("additionne uniquement la même métrique entre réseaux", () => {
    expect(sumMetric([snapshot({ followers: 10 }), snapshot({ followers: 15, views: 100 })], "followers")).toBe(25);
    expect(sumMetric([snapshot({ views: 100 })], "reach")).toBeNull();
  });
  it("calcule les variations positives et négatives", () => {
    expect(compareMetric(120, 100)).toMatchObject({ changeAbsolute: 20, changePercent: 20 });
    expect(compareMetric(80, 100)).toMatchObject({ changeAbsolute: -20, changePercent: -20 });
  });
  it("retourne null lorsque la période précédente vaut zéro ou manque", () => {
    expect(compareMetric(10, 0).changePercent).toBeNull();
    expect(compareMetric(null, 10).changeAbsolute).toBeNull();
  });
  it("calcule l’engagement sans jamais diviser par zéro", () => {
    expect(calculateEngagementRate(25, 1000)).toBe(2.5);
    expect(calculateEngagementRate(25, 0)).toBeNull();
    expect(calculateEngagementRate(null, 100)).toBeNull();
  });
  it("additionne les interactions présentes sans inventer les absentes", () => {
    expect(sumInteractions([snapshot({ likes: 5, comments: 2 }), snapshot({ shares: 1 })])).toBe(8);
    expect(sumInteractions([snapshot({ followers: 10 })])).toBeNull();
  });
  it("choisit un indicateur principal selon la plateforme", () => {
    expect(primaryMetricForPlatform("tiktok")).toBe("views");
    expect(primaryMetricForPlatform("linkedin")).toBe("impressions");
    expect(primaryMetricForPlatform("instagram")).toBe("reach");
  });
  it("classe uniquement les publications possédant la métrique demandée", () => {
    const posts = [
      { id: "post-a", version: 1 as const, socialAccountId: "account", externalPostId: "a", platform: "instagram" as const, hashtags: [], fetchedAt: "2026-01-01" },
      { id: "post-b", version: 1 as const, socialAccountId: "account", externalPostId: "b", platform: "instagram" as const, hashtags: [], fetchedAt: "2026-01-01" },
      { id: "post-c", version: 1 as const, socialAccountId: "account", externalPostId: "c", platform: "instagram" as const, hashtags: [], fetchedAt: "2026-01-01" },
    ];
    const snapshots = [
      { id: "metric-a", version: 1 as const, socialPostId: "post-a", capturedAt: "2026-01-01", metrics: { likes: 5 }, sourceMetrics: {} },
      { id: "metric-b", version: 1 as const, socialPostId: "post-b", capturedAt: "2026-01-01", metrics: { likes: 12 }, sourceMetrics: {} },
    ];
    expect(rankPostsByMetric(posts, snapshots, "likes").map((post) => post.id)).toEqual(["post-b", "post-a"]);
  });
});
