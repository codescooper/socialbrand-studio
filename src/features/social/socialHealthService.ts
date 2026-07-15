import type {
  MetricComparison,
  MetricValue,
  SocialMetricKey,
  SocialMetricSnapshotRecord,
  SocialPlatform,
  SocialPostMetricSnapshotRecord,
  SocialPostRecord,
} from "../../types/social";

export const INTERACTION_KEYS: SocialMetricKey[] = ["reactions", "likes", "comments", "shares", "saves"];

export function sumMetric(snapshots: SocialMetricSnapshotRecord[], key: SocialMetricKey): MetricValue {
  const values = snapshots.map((snapshot) => snapshot.metrics[key]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

export function sumInteractions(snapshots: SocialMetricSnapshotRecord[]): MetricValue {
  const values = INTERACTION_KEYS.flatMap((key) => snapshots.map((snapshot) => snapshot.metrics[key])).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

export function compareMetric(current: MetricValue, previous: MetricValue): MetricComparison {
  const comparable = current !== null && previous !== null;
  const changeAbsolute = comparable ? current - previous : null;
  return {
    current,
    previous,
    changeAbsolute,
    changePercent: comparable && previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : null,
  };
}

export function calculateEngagementRate(interactions: MetricValue, denominator: MetricValue): MetricValue {
  if (interactions === null || denominator === null || denominator <= 0) return null;
  return (interactions / denominator) * 100;
}

export function rankPostsByMetric(posts: SocialPostRecord[], snapshots: SocialPostMetricSnapshotRecord[], key: SocialMetricKey) {
  const values = new Map<string, number>();
  for (const snapshot of snapshots) {
    const value = snapshot.metrics[key];
    if (typeof value === "number" && Number.isFinite(value)) values.set(snapshot.socialPostId, Math.max(value, values.get(snapshot.socialPostId) ?? value));
  }
  return posts.filter((post) => values.has(post.id)).sort((a, b) => (values.get(b.id) ?? 0) - (values.get(a.id) ?? 0));
}

export function primaryMetricForPlatform(platform: SocialPlatform): SocialMetricKey {
  if (platform === "tiktok") return "views";
  if (platform === "linkedin") return "impressions";
  return "reach";
}
