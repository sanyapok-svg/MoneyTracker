import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Клиент с правами service_role. Только из Server Actions / Server Components.
 * Не импортировать из `"use client"`.
 */
export function createSupabaseServiceRoleClient() {
  const key = getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error(
      "Для админки задайте SUPABASE_SERVICE_ROLE_KEY в .env.local (без NEXT_PUBLIC_).",
    );
  }
  const { url } = requireSupabaseEnv();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
