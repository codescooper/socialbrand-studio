export type CloudConfig = {
  url: string;
  publishableKey: string;
};

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

export const cloudConfig: CloudConfig | null = url && publishableKey ? { url, publishableKey } : null;
