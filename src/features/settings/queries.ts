import "server-only";

import { getWooEnvStatus } from "@/features/settings/env";
import type { SettingsPageData } from "@/features/settings/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const wooEnv = getWooEnvStatus();

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        wooEnv,
        profile: null,
        wooConnection: null,
        errorMessage: "You must be signed in to view settings."
      };
    }

    const [{ data: profile }, { data: connections }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle(),
      supabase
        .from("woo_connections")
        .select("id, name, store_url, is_active, last_successful_sync_at, last_error_message")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
    ]);

    const connection = connections?.[0] ?? null;

    return {
      wooEnv,
      profile: {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? "staff"
      },
      wooConnection: connection
        ? {
            id: connection.id,
            name: connection.name,
            storeUrl: connection.store_url,
            isActive: connection.is_active,
            lastSuccessfulSyncAt: connection.last_successful_sync_at,
            lastErrorMessage: connection.last_error_message
          }
        : null,
      errorMessage: null
    };
  } catch {
    return {
      wooEnv,
      profile: null,
      wooConnection: null,
      errorMessage: "Unable to load settings right now."
    };
  }
}
