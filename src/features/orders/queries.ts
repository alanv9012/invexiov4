import "server-only";

import { firstSearchParam } from "@/lib/search-params";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  OrderRow,
  OrderSource,
  OrderSyncStatus,
  OrdersSearchParams
} from "@/features/orders/types";
import { z } from "zod";

export type OrderFormProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
};

const ordersSearchSchema = z.object({
  q: z.string().trim().optional(),
  status: z.string().trim().optional(),
  source: z.enum(["all", "manual", "woocommerce", "system"]).default("all"),
  sync: z.enum(["all", "synced", "pending", "failed"]).default("all")
});

export function parseOrdersSearchParams(input: OrdersSearchParams): {
  query: string;
  orderStatus: string;
  source: "all" | OrderSource;
  sync: "all" | OrderSyncStatus;
} {
  const parsed = ordersSearchSchema.safeParse({
    q: firstSearchParam(input.q),
    status: firstSearchParam(input.status),
    source: firstSearchParam(input.source),
    sync: firstSearchParam(input.sync)
  });

  if (!parsed.success) {
    return { query: "", orderStatus: "all", source: "all", sync: "all" };
  }

  return {
    query: parsed.data.q ?? "",
    orderStatus: parsed.data.status && parsed.data.status.length > 0 ? parsed.data.status : "all",
    source: parsed.data.source,
    sync: parsed.data.sync
  };
}

function buildOrderSyncStatus(
  wooOrderId: number | null,
  lastSyncedAt: string | null,
  source: OrderSource
): OrderSyncStatus {
  if (source === "manual") return "synced";
  if (wooOrderId && lastSyncedAt) return "synced";
  if (wooOrderId) return "pending";
  return "failed";
}

export async function getOrders(filters: ReturnType<typeof parseOrdersSearchParams>): Promise<{
  orders: OrderRow[];
  errorMessage: string | null;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    let queryBuilder = supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, status, total_amount, currency, source, ordered_at, woo_order_id, last_synced_at"
      )
      .order("ordered_at", { ascending: false })
      .limit(100);

    if (filters.query) {
      queryBuilder = queryBuilder.or(
        `order_number.ilike.%${filters.query}%,customer_name.ilike.%${filters.query}%,status.ilike.%${filters.query}%`
      );
    }

    if (filters.orderStatus !== "all") {
      queryBuilder = queryBuilder.eq("status", filters.orderStatus);
    }

    if (filters.source !== "all") {
      queryBuilder = queryBuilder.eq("source", filters.source);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      return { orders: [], errorMessage: "Unable to load orders right now." };
    }

    const orders: OrderRow[] = (data ?? [])
      .map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        status: row.status,
        total: Number(row.total_amount ?? 0),
        currency: row.currency,
        source: row.source as OrderSource,
        createdAt: row.ordered_at,
        syncStatus: buildOrderSyncStatus(row.woo_order_id, row.last_synced_at, row.source as OrderSource)
      }))
      .filter((order) => filters.sync === "all" || order.syncStatus === filters.sync);

    return { orders, errorMessage: null };
  } catch {
    return { orders: [], errorMessage: "Unable to load orders right now." };
  }
}

export async function getProductsForOrderForm(): Promise<{
  products: OrderFormProduct[];
  errorMessage: string | null;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, price, stock_quantity")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      return { products: [], errorMessage: "Unable to load products for order creation." };
    }

    const products: OrderFormProduct[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      price: Number(row.price ?? 0),
      stockQuantity: row.stock_quantity
    }));

    return { products, errorMessage: null };
  } catch {
    return { products: [], errorMessage: "Unable to load products for order creation." };
  }
}
