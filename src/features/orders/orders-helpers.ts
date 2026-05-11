import { z } from "zod";
import type { OrderRow, OrderSource, OrderSyncStatus, OrdersSearchParams } from "@/features/orders/types";
import { MOCK_ORDERS } from "@/features/orders/mock-orders";

const ordersSearchSchema = z.object({
  q: z.string().trim().optional(),
  status: z.string().trim().optional(),
  source: z.enum(["all", "manual", "woocommerce", "system"]).default("all"),
  sync: z.enum(["all", "synced", "pending", "failed"]).default("all")
});

function first(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function parseOrdersSearchParams(input: OrdersSearchParams): {
  query: string;
  orderStatus: string;
  source: "all" | OrderSource;
  sync: "all" | OrderSyncStatus;
} {
  const parsed = ordersSearchSchema.safeParse({
    q: first(input.q),
    status: first(input.status),
    source: first(input.source),
    sync: first(input.sync)
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

export function filterMockOrders(
  orders: OrderRow[],
  filters: ReturnType<typeof parseOrdersSearchParams>
): OrderRow[] {
  const q = filters.query.toLowerCase();

  return orders.filter((order) => {
    const matchesQuery =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q);

    const matchesOrderStatus =
      filters.orderStatus === "all" || order.status === filters.orderStatus;

    const matchesSource = filters.source === "all" || order.source === filters.source;
    const matchesSync = filters.sync === "all" || order.syncStatus === filters.sync;

    return matchesQuery && matchesOrderStatus && matchesSource && matchesSync;
  });
}

export function getMockOrdersForPage(searchParams: OrdersSearchParams): {
  orders: OrderRow[];
  filters: ReturnType<typeof parseOrdersSearchParams>;
} {
  const filters = parseOrdersSearchParams(searchParams);
  const orders = filterMockOrders(MOCK_ORDERS, filters);
  return { orders, filters };
}
