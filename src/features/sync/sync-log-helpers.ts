import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type SyncLogType = "products" | "orders" | "inventory" | "connection";

export async function startSyncLog(
  supabase: SupabaseClient,
  type: SyncLogType,
  message: string
): Promise<{ syncLogId: string | null; syncStart: string }> {
  const syncStart = new Date().toISOString();
  const { data: logRow } = await supabase
    .from("sync_logs")
    .insert({
      type,
      status: "running",
      message,
      payload: {},
      started_at: syncStart,
      finished_at: null
    })
    .select("id")
    .single();

  return { syncLogId: logRow?.id ?? null, syncStart };
}

export async function completeSyncLogSuccess(
  supabase: SupabaseClient,
  syncLogId: string | null,
  message: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!syncLogId) return;

  await supabase
    .from("sync_logs")
    .update({
      status: "success",
      message,
      payload,
      finished_at: new Date().toISOString()
    })
    .eq("id", syncLogId);
}

export async function completeSyncLogFailure(
  supabase: SupabaseClient,
  syncLogId: string | null,
  syncStart: string,
  type: SyncLogType,
  message: string
): Promise<void> {
  if (syncLogId) {
    await supabase
      .from("sync_logs")
      .update({
        status: "failed",
        message,
        payload: {},
        finished_at: new Date().toISOString()
      })
      .eq("id", syncLogId);
    return;
  }

  await supabase.from("sync_logs").insert({
    type,
    status: "failed",
    message,
    payload: {},
    started_at: syncStart,
    finished_at: new Date().toISOString()
  });
}
