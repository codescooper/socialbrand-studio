export type SocialProvider = "meta" | "tiktok" | "linkedin";

export type OAuthStartInput = {
  provider: SocialProvider;
  workspaceId: string;
  returnUrl: string;
};

export type OAuthStateRecord = {
  stateHash: string;
  provider: SocialProvider;
  userId: string;
  workspaceId: string;
  returnUrl: string;
  expiresAt: string;
};

export type ServerSocialConnector = {
  provider: SocialProvider;
  getAuthorizationUrl(input: OAuthStartInput, userId: string): Promise<string>;
  exchangeCode(input: { code: string; state: OAuthStateRecord }): Promise<{ accessToken: string; expiresAt?: string; grantedScopes: string[] }>;
  revoke(connectionId: string): Promise<void>;
};

export class ProviderNotConfiguredError extends Error {
  constructor(provider: SocialProvider) {
    super(`Le fournisseur ${provider} n’est pas configuré.`);
    this.name = "ProviderNotConfiguredError";
  }
}
