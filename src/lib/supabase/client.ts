import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient(url, key);
}
