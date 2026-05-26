export type OrderSource = "manual" | "woocommerce" | "system";

export type OrderSyncStatus = "synced" | "pending" | "failed";

export type OrderRow = {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  status: string;
  total: number;
  currency: string;
  source: OrderSource;
  createdAt: string;
  syncStatus: OrderSyncStatus;
};

export type OrdersSearchParams = {
  q?: string | string[];
  status?: string | string[];
  source?: string | string[];
  sync?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
};

export const ORDER_SORT_KEYS = ["ordered_at", "order_number", "customer_name", "status", "total_amount"] as const;
export type OrderSortKey = (typeof ORDER_SORT_KEYS)[number];

export type OrdersListResult = {
  orders: OrderRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: OrderSortKey;
  sortDir: "asc" | "desc";
  errorMessage: string | null;
};
