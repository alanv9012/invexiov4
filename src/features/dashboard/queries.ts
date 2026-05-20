import "server-only";

import {
  buildDailyCountSeries,
  buildDailyMovementSeries,
  computeTrend,
  DASHBOARD_CHART_DAYS,
  splitRecentAndPriorCounts
} from "@/features/dashboard/analytics";
import type {
  DashboardActivityItem,
  DashboardData,
  DashboardLowStockProduct,
  DashboardRecentMovement,
  DashboardRecentOrder,
  DashboardSyncSummaryItem
} from "@/features/dashboard/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { stockThresholds } from "@/lib/ui/tokens";

function startOfUtcDay(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function sevenDaysAgo(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString();
}

function fourteenDaysAgo(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 14);
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

function buildActivityFeed(
  orders: DashboardRecentOrder[],
  movements: DashboardRecentMovement[]
): DashboardActivityItem[] {
  const orderItems: DashboardActivityItem[] = orders.map((order) => ({
    type: "order",
    id: order.id,
    title: order.orderNumber ? `Order #${order.orderNumber}` : `Order ${order.id.slice(0, 8)}`,
    subtitle: order.customerName ?? "No customer name",
    timestamp: order.orderedAt,
    status: order.status,
    amount: order.totalAmount
  }));

  const movementItems: DashboardActivityItem[] = movements.map((movement) => ({
    type: "movement",
    id: movement.id,
    title: movement.productName,
    subtitle: movement.reason,
    timestamp: movement.createdAt,
    changeQuantity: movement.changeQuantity,
    source: movement.source
  }));

  return [...orderItems, ...movementItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);
}

export async function getDashboardData(): Promise<DashboardData> {
  const emptyTrend = computeTrend(0, 0, "vs prior week");
  const empty: DashboardData = {
    totalProducts: 0,
    lowStockProducts: 0,
    recentOrdersCount: 0,
    failedSyncs: 0,
    movementsToday: 0,
    recentOrders: [],
    recentMovements: [],
    syncSummary: [],
    orderVolumeByDay: [],
    movementActivityByDay: [],
    lowStockItems: [],
    activityFeed: [],
    metricTrends: {
      orders: emptyTrend,
      movements: emptyTrend,
      lowStock: emptyTrend
    },
    errorMessage: null
  };

  try {
    const supabase = await getSupabaseServerClient();
    const todayStart = startOfUtcDay();
    const chartStart = fourteenDaysAgo();

    const [
      totalProductsResult,
      lowStockResult,
      recentOrdersCountResult,
      failedSyncsResult,
      movementsTodayResult,
      recentOrdersResult,
      recentMovementsResult,
      syncLogsResult,
      orderChartResult,
      movementChartResult,
      lowStockListResult,
      movementsPriorWeekResult
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("stock_quantity", 1)
        .lte("stock_quantity", stockThresholds.lowStockMax),
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
        .limit(12),
      supabase
        .from("inventory_movements")
        .select("id, change_quantity, reason, source, created_at, products(name)")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("sync_logs")
        .select("type, status")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("orders").select("ordered_at").gte("ordered_at", chartStart),
      supabase
        .from("inventory_movements")
        .select("created_at, change_quantity")
        .gte("created_at", chartStart),
      supabase
        .from("products")
        .select("id, name, sku, stock_quantity")
        .gte("stock_quantity", 1)
        .lte("stock_quantity", stockThresholds.lowStockMax)
        .order("stock_quantity", { ascending: true })
        .limit(8),
      supabase
        .from("inventory_movements")
        .select("*", { count: "exact", head: true })
        .gte("created_at", fourteenDaysAgo())
        .lt("created_at", sevenDaysAgo())
    ]);

    const queryError =
      totalProductsResult.error ||
      lowStockResult.error ||
      recentOrdersCountResult.error ||
      failedSyncsResult.error ||
      movementsTodayResult.error ||
      recentOrdersResult.error ||
      recentMovementsResult.error ||
      syncLogsResult.error ||
      orderChartResult.error ||
      movementChartResult.error ||
      lowStockListResult.error ||
      movementsPriorWeekResult.error;

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

    const orderTimestamps = (orderChartResult.data ?? []).map((row) => row.ordered_at);
    const movementRows = (movementChartResult.data ?? []).map((row) => ({
      createdAt: row.created_at,
      changeQuantity: row.change_quantity
    }));

    const orderVolumeByDay = buildDailyCountSeries(orderTimestamps, DASHBOARD_CHART_DAYS);
    const movementActivityByDay = buildDailyMovementSeries(movementRows, DASHBOARD_CHART_DAYS);

    const orderSplit = splitRecentAndPriorCounts(orderTimestamps, DASHBOARD_CHART_DAYS);
    const movementsPriorWeekTotal = movementsPriorWeekResult.count ?? 0;
    const movementsThisWeek = movementRows.filter(
      (row) => new Date(row.createdAt) >= new Date(sevenDaysAgo())
    ).length;

    const lowStockItems: DashboardLowStockProduct[] = (lowStockListResult.data ?? []).map(
      (row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        stockQuantity: row.stock_quantity
      })
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
      orderVolumeByDay,
      movementActivityByDay,
      lowStockItems,
      activityFeed: buildActivityFeed(recentOrders, recentMovements),
      metricTrends: {
        orders: computeTrend(orderSplit.recent, orderSplit.prior, "vs prior week"),
        movements: computeTrend(movementsThisWeek, movementsPriorWeekTotal, "vs prior week"),
        lowStock: {
          percentChange: null,
          direction: (lowStockResult.count ?? 0) > 0 ? "up" : "flat",
          label: (lowStockResult.count ?? 0) > 0 ? "Needs attention" : "Healthy levels"
        }
      },
      errorMessage: null
    };
  } catch {
    return { ...empty, errorMessage: "Unable to load dashboard data right now." };
  }
}
