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
};
