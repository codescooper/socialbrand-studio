import type { SocialPlatform } from "./social";

export type ContentObjective = "awareness" | "engagement" | "traffic" | "sales";
export type ContentDraftStatus = "draft" | "review" | "approved" | "scheduled" | "published";
export type ContentDraftRecord = {
  id: string;
  version: 1;
  brandKitId: string;
  source: "user" | "ai" | "adapted";
  objective: ContentObjective;
  status: ContentDraftStatus;
  title?: string;
  caption: string;
  callToAction?: string;
  hashtags: string[];
  mediaAssetIds: string[];
  targetPlatforms: SocialPlatform[];
  basedOnPostIds: string[];
  userIdea?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicationTargetStatus = "draft" | "ready" | "scheduled" | "publishing" | "published" | "failed" | "cancelled";
export type PublicationTarget = {
  id: string;
  draftId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  status: PublicationTargetStatus;
  scheduledFor?: string;
  externalPostId?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type ContentGenerationContext = {
  brandKitId: string;
  businessActivity?: string;
  communicationTone?: string;
  socialAccountIds: string[];
  topPostIds: string[];
  metricSnapshotIds: string[];
  userIdea: string;
  objective: ContentObjective;
  targetPlatforms: SocialPlatform[];
};
