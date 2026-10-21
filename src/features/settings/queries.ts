import "server-only";

import { getWooEnvStatus } from "@/server/woocommerce/env";
import type { SettingsPageData } from "@/features/settings/types";
import {
  authorizePermission,
  contextHasPermission
} from "@/server/auth/authorization";

export async function getSettingsPageData(): Promise<SettingsPageData> {
  try {
    const authorization = await authorizePermission("profile.update_self");

    if (!authorization.authorized) {
      return {
        wooEnv: null,
        profile: null,
        wooConnection: null,
        canManageIntegrations: false,
        errorMessage: "You do not have permission to view settings."
      };
    }

    const { supabase, user } = authorization;
    const canManageIntegrations = await contextHasPermission(
      authorization,
      "integrations.manage"
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    const connectionsResult = canManageIntegrations
      ? await supabase
        .from("woo_connections")
        .select("id, name, store_url, is_active, last_successful_sync_at, last_error_message")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
      : { data: null };

    const connection = connectionsResult.data?.[0] ?? null;

    return {
      wooEnv: canManageIntegrations ? getWooEnvStatus() : null,
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
      canManageIntegrations,
      errorMessage: null
    };
  } catch {
    return {
      wooEnv: null,
      profile: null,
      wooConnection: null,
      canManageIntegrations: false,
      errorMessage: "Unable to load settings right now."
    };
  }
}
