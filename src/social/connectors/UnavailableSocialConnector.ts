import type { SocialPlatform } from "../../types/social";
import { SocialConnectorUnavailableError, type SocialConnector } from "./SocialConnector";

export class UnavailableSocialConnector implements SocialConnector {
  constructor(public readonly platform: SocialPlatform) {}
  getAuthorizationUrl(_input: { brandKitId: string; returnUrl: string }): Promise<string> {
    return Promise.reject(new SocialConnectorUnavailableError(this.platform));
  }
  disconnect(_accountId: string): Promise<void> {
    return Promise.reject(new SocialConnectorUnavailableError(this.platform));
  }
  syncAccount(_accountId: string): Promise<never> {
    return Promise.reject(new SocialConnectorUnavailableError(this.platform));
  }
}
