export const BUSINESS_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type BusinessRole = (typeof BUSINESS_ROLES)[number];

export type BusinessWorkspaceRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessMembershipRecord = {
  workspace_id: string;
  role: BusinessRole;
};

export type CloudBrandKitLinkRecord = {
  id: string;
  workspaceId: string;
  localBrandKitId: string;
  brandName: string;
};
