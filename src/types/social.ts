export const SOCIAL_PLATFORMS = ["facebook", "instagram", "tiktok", "linkedin"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialConnectionMode = "manual" | "oauth";
export type SocialConnectionStatus = "manual" | "connected" | "expired" | "permission_required" | "error" | "disconnected";

export type SocialAccountRecord = {
  id: string;
  version: 1;
  brandKitId: string;
  platform: SocialPlatform;
  externalAccountId?: string;
  displayName: string;
  username?: string;
  profileUrl?: string;
  accountType?: string;
  notes?: string;
  connectionMode: SocialConnectionMode;
  connectionStatus: SocialConnectionStatus;
  grantedScopes: string[];
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SocialMetricKey =
  | "followers"
  | "following"
  | "reach"
  | "impressions"
  | "views"
  | "reactions"
  | "likes"
  | "comments"
  | "shares"
  | "saves"
  | "clicks"
  | "profile_visits"
  | "published_posts";

export type SocialMetricSnapshotRecord = {
  id: string;
  version: 1;
  socialAccountId: string;
  capturedAt: string;
  periodStart?: string;
  periodEnd?: string;
  metrics: Partial<Record<SocialMetricKey, number>>;
  sourceMetrics: Record<string, number>;
  source: "manual" | "api";
};

export type SocialPostRecord = {
  id: string;
  version: 1;
  socialAccountId: string;
  externalPostId: string;
  platform: SocialPlatform;
  postType?: string;
  caption?: string;
  publicUrl?: string;
  thumbnailUrl?: string;
  hashtags: string[];
  publishedAt?: string;
  fetchedAt: string;
};

export type SocialPostMetricSnapshotRecord = {
  id: string;
  version: 1;
  socialPostId: string;
  capturedAt: string;
  metrics: Partial<Record<SocialMetricKey, number>>;
  sourceMetrics: Record<string, number>;
};

export type MetricValue = number | null;
export type MetricComparison = {
  current: MetricValue;
  previous: MetricValue;
  changeAbsolute: MetricValue;
  changePercent: MetricValue;
};
