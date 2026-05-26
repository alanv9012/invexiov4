import "server-only";

import { firstSearchParam } from "@/lib/search-params";
import { getPaginationMeta, parseTableListParams } from "@/lib/ui/table-params";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  ORDER_SORT_KEYS,
  type OrderRow,
  type OrderSortKey,
  type OrderSource,
  type OrdersListResult,
  type OrderSyncStatus,
  type OrdersSearchParams
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
  page: number;
  pageSize: number;
  sort: OrderSortKey;
  sortDir: "asc" | "desc";
} {
  const parsed = ordersSearchSchema.safeParse({
    q: firstSearchParam(input.q),
    status: firstSearchParam(input.status),
    source: firstSearchParam(input.source),
    sync: firstSearchParam(input.sync)
  });

  const table = parseTableListParams(input, "ordered_at", ORDER_SORT_KEYS);

  if (!parsed.success) {
    return { query: "", orderStatus: "all", source: "all", sync: "all", ...table, sort: "ordered_at" };
  }

  return {
    query: parsed.data.q ?? "",
    orderStatus: parsed.data.status && parsed.data.status.length > 0 ? parsed.data.status : "all",
    source: parsed.data.source,
    sync: parsed.data.sync,
    ...table
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

function applyOrderSyncFilter<T extends { or: Function; not: Function; is: Function; eq: Function }>(
  queryBuilder: T,
  sync: "all" | OrderSyncStatus
): T {
  if (sync === "synced") {
    return queryBuilder.or("source.eq.manual,and(woo_order_id.not.is.null,last_synced_at.not.is.null)") as T;
  }

  if (sync === "pending") {
    return queryBuilder.not("woo_order_id", "is", null).is("last_synced_at", null) as T;
  }

  if (sync === "failed") {
    return queryBuilder.is("woo_order_id", null).eq("source", "woocommerce") as T;
  }

  return queryBuilder;
}

export async function getOrders(
  filters: ReturnType<typeof parseOrdersSearchParams>
): Promise<OrdersListResult> {
  const empty: OrdersListResult = {
    orders: [],
    totalCount: 0,
    page: filters.page,
    pageSize: filters.pageSize,
    sort: filters.sort,
    sortDir: filters.sortDir,
    errorMessage: null
  };

  try {
    const supabase = await getSupabaseServerClient();
    const rangeFrom = (filters.page - 1) * filters.pageSize;
    const rangeTo = rangeFrom + filters.pageSize - 1;

    let queryBuilder = supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, status, total_amount, currency, source, ordered_at, woo_order_id, last_synced_at",
        { count: "exact" }
      );

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

    queryBuilder = applyOrderSyncFilter(queryBuilder, filters.sync);

    const { data, error, count } = await queryBuilder
      .order(filters.sort, { ascending: filters.sortDir === "asc" })
      .range(rangeFrom, rangeTo);

    if (error) {
      return { ...empty, errorMessage: "Unable to load orders right now." };
    }

    const totalCount = count ?? 0;
    const { safePage } = getPaginationMeta(filters.page, filters.pageSize, totalCount);

    const orders: OrderRow[] = (data ?? []).map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      status: row.status,
      total: Number(row.total_amount ?? 0),
      currency: row.currency,
      source: row.source as OrderSource,
      createdAt: row.ordered_at,
      syncStatus: buildOrderSyncStatus(row.woo_order_id, row.last_synced_at, row.source as OrderSource)
    }));

    return {
      orders,
      totalCount,
      page: safePage,
      pageSize: filters.pageSize,
      sort: filters.sort,
      sortDir: filters.sortDir,
      errorMessage: null
    };
  } catch {
    return { ...empty, errorMessage: "Unable to load orders right now." };
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
