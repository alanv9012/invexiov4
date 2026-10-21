import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type InvexioPermission =
  | "products.read"
  | "inventory.read"
  | "orders.read"
  | "orders.create_manual"
  | "profile.update_self"
  | "inventory_movements.read"
  | "inventory.adjust"
  | "products.price.update"
  | "orders.completed.manage"
  | "users.manage"
  | "integrations.manage"
  | "sync.run"
  | "reports.financial.read";

export type AuthorizationFailureReason = "unauthenticated" | "forbidden" | "unavailable";

export type AuthorizedContext = {
  authorized: true;
  supabase: SupabaseClient;
  user: User;
};

export type AuthorizationFailure = {
  authorized: false;
  reason: AuthorizationFailureReason;
};

export type AuthorizationResult = AuthorizedContext | AuthorizationFailure;

const privilegedAuthorizationBrand: unique symbol = Symbol("invexio.privileged-authorization");

export type PrivilegedAuthorization = AuthorizedContext & {
  readonly [privilegedAuthorizationBrand]: true;
};

export type PrivilegedPermission = "inventory.adjust" | "integrations.manage" | "sync.run";

async function loadAuthenticatedContext(): Promise<AuthorizationResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    return { authorized: false, reason: "unavailable" };
  }

  if (!user) {
    return { authorized: false, reason: "unauthenticated" };
  }

  return { authorized: true, supabase, user };
}

export async function authorizePermission(
  permission: InvexioPermission
): Promise<AuthorizationResult> {
  const context = await loadAuthenticatedContext();

  if (!context.authorized) {
    return context;
  }

  const { data: allowed, error } = await context.supabase.rpc("has_permission", {
    p_permission: permission
  });

  if (error) {
    return { authorized: false, reason: "unavailable" };
  }

  if (allowed !== true) {
    return { authorized: false, reason: "forbidden" };
  }

  return context;
}

export async function authorizePrivilegedPermission(
  permission: PrivilegedPermission
): Promise<PrivilegedAuthorization | AuthorizationFailure> {
  const context = await authorizePermission(permission);

  if (!context.authorized) {
    return context;
  }

  return {
    ...context,
    [privilegedAuthorizationBrand]: true
  };
}

export function isPrivilegedAuthorization(
  value: unknown
): value is PrivilegedAuthorization {
  return (
    typeof value === "object" &&
    value !== null &&
    privilegedAuthorizationBrand in value &&
    value[privilegedAuthorizationBrand] === true
  );
}

export async function contextHasPermission(
  context: AuthorizedContext,
  permission: InvexioPermission
): Promise<boolean> {
  const { data, error } = await context.supabase.rpc("has_permission", {
    p_permission: permission
  });

  return !error && data === true;
}

export async function currentUserHasPermission(permission: InvexioPermission): Promise<boolean> {
  const result = await authorizePermission(permission);
  return result.authorized;
}
