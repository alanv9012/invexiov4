import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";

export function getSupabaseAdminClient(): SupabaseClient {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
}
