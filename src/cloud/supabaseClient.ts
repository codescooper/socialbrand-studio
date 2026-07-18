import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cloudConfig } from "./config";

let client: SupabaseClient | null | undefined;

export function getSupabaseClient() {
  if (client !== undefined) return client;
  client = cloudConfig
    ? createClient(cloudConfig.url, cloudConfig.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
  return client;
}
