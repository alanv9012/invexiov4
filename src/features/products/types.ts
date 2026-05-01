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
};
