import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import {
  isPrivilegedAuthorization,
  type PrivilegedAuthorization
} from "@/server/auth/authorization";

export function getSupabaseAdminClient(
  authorization: PrivilegedAuthorization
): SupabaseClient {
  if (!isPrivilegedAuthorization(authorization)) {
    throw new Error("Privileged authorization is required for the Supabase service-role client.");
  }

  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
}
