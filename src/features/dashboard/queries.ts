import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DashboardData,
  DashboardRecentMovement,
  DashboardRecentOrder,
  DashboardSyncSummaryItem
} from "@/features/dashboard/types";

function startOfUtcDay(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function sevenDaysAgo(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString();
}

function buildSyncSummary(
  logs: Array<{ type: string; status: string }>
): DashboardSyncSummaryItem[] {
  const counts = new Map<string, number>();

  for (const log of logs) {
    const key = `${log.type}:${log.status}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => {
      const [type, status] = key.split(":");
      return { type, status, count };
    })
    .sort((a, b) => a.type.localeCompare(b.type) || a.status.localeCompare(b.status));
}

export async function getDashboardData(): Promise<DashboardData> {
  const empty: DashboardData = {
    totalProducts: 0,
    lowStockProducts: 0,
    recentOrdersCount: 0,
    failedSyncs: 0,
    movementsToday: 0,
    recentOrders: [],
    recentMovements: [],
    syncSummary: [],
    errorMessage: null
  };

  try {
    const supabase = await getSupabaseServerClient();
    const todayStart = startOfUtcDay();

    const [
      totalProductsResult,
      lowStockResult,
      recentOrdersCountResult,
      failedSyncsResult,
      movementsTodayResult,
      recentOrdersResult,
      recentMovementsResult,
      syncLogsResult
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("stock_quantity", 1)
        .lte("stock_quantity", 10),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("ordered_at", sevenDaysAgo()),
      supabase
        .from("sync_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
      supabase
        .from("inventory_movements")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, status, total_amount, ordered_at")
        .order("ordered_at", { ascending: false })
        .limit(8),
      supabase
        .from("inventory_movements")
        .select("id, change_quantity, reason, source, created_at, products(name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("sync_logs")
        .select("type, status")
        .order("created_at", { ascending: false })
        .limit(100)
    ]);

    const queryError =
      totalProductsResult.error ||
      lowStockResult.error ||
      recentOrdersCountResult.error ||
      failedSyncsResult.error ||
      movementsTodayResult.error ||
      recentOrdersResult.error ||
      recentMovementsResult.error ||
      syncLogsResult.error;

    if (queryError) {
      return { ...empty, errorMessage: "Unable to load dashboard data right now." };
    }

    const recentOrders: DashboardRecentOrder[] = (recentOrdersResult.data ?? []).map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      status: row.status,
      totalAmount: Number(row.total_amount ?? 0),
      orderedAt: row.ordered_at
    }));

    const recentMovements: DashboardRecentMovement[] = (recentMovementsResult.data ?? []).map(
      (row) => {
        const product = row.products as { name: string } | { name: string }[] | null;
        const productName = Array.isArray(product) ? product[0]?.name : product?.name;

        return {
          id: row.id,
          productName: productName ?? "Unknown product",
          changeQuantity: row.change_quantity,
          reason: row.reason,
          source: row.source,
          createdAt: row.created_at
        };
      }
    );

    return {
      totalProducts: totalProductsResult.count ?? 0,
      lowStockProducts: lowStockResult.count ?? 0,
      recentOrdersCount: recentOrdersCountResult.count ?? 0,
      failedSyncs: failedSyncsResult.count ?? 0,
      movementsToday: movementsTodayResult.count ?? 0,
      recentOrders,
      recentMovements,
      syncSummary: buildSyncSummary(syncLogsResult.data ?? []),
      errorMessage: null
    };
  } catch {
    return { ...empty, errorMessage: "Unable to load dashboard data right now." };
  }
}
