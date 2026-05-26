export type ProductSyncStatus = "synced" | "pending";

export type ProductItem = {
  id: string;
  thumbnailPath: string;
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  syncStatus: ProductSyncStatus;
  lastSyncedAt: string | null;
};

export type ProductStatusFilter = "all" | ProductSyncStatus;
export type ProductStockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export type ProductsSearchParams = {
  q?: string | string[];
  status?: string | string[];
  stock?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
};

export const PRODUCT_SORT_KEYS = ["updated_at", "name", "sku", "price", "stock_quantity", "last_synced_at"] as const;
export type ProductSortKey = (typeof PRODUCT_SORT_KEYS)[number];

export type ProductsListResult = {
  products: ProductItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: ProductSortKey;
  sortDir: "asc" | "desc";
  errorMessage: string | null;
};
