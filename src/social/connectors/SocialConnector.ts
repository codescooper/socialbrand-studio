import type { SocialAccountRecord, SocialMetricSnapshotRecord, SocialPlatform, SocialPostRecord } from "../../types/social";

export interface SocialConnector {
  platform: SocialPlatform;
  getAuthorizationUrl(input: { brandKitId: string; returnUrl: string }): Promise<string>;
  disconnect(accountId: string): Promise<void>;
  syncAccount(accountId: string): Promise<{ account: SocialAccountRecord; metrics: SocialMetricSnapshotRecord[]; posts: SocialPostRecord[] }>;
}

export class SocialConnectorUnavailableError extends Error {
  constructor(platform: SocialPlatform) {
    super(`Le connecteur API ${platform} n’est pas encore disponible.`);
    this.name = "SocialConnectorUnavailableError";
  }
}
