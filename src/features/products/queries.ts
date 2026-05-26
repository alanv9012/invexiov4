import "server-only";

import { z } from "zod";
import { firstSearchParam } from "@/lib/search-params";
import { getPaginationMeta, parseTableListParams } from "@/lib/ui/table-params";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  PRODUCT_SORT_KEYS,
  type ProductItem,
  type ProductSortKey,
  type ProductsListResult,
  type ProductStatusFilter,
  type ProductStockFilter,
  type ProductsSearchParams
} from "@/features/products/types";

const productsSearchSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["all", "synced", "pending"]).default("all"),
  stock: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).default("all")
});

export function parseProductsSearchParams(input: ProductsSearchParams): {
  query: string;
  status: ProductStatusFilter;
  stock: ProductStockFilter;
  page: number;
  pageSize: number;
  sort: ProductSortKey;
  sortDir: "asc" | "desc";
} {
  const parsed = productsSearchSchema.safeParse({
    q: firstSearchParam(input.q),
    status: firstSearchParam(input.status),
    stock: firstSearchParam(input.stock)
  });

  const table = parseTableListParams(input, "updated_at", PRODUCT_SORT_KEYS);

  if (!parsed.success) {
    return {
      query: "",
      status: "all",
      stock: "all",
      ...table,
      sort: "updated_at"
    };
  }

  return {
    query: parsed.data.q ?? "",
    status: parsed.data.status,
    stock: parsed.data.stock,
    ...table
  };
}

function buildSyncStatus(lastSyncedAt: string | null, wooProductId: number | null): "synced" | "pending" {
  if (!lastSyncedAt || !wooProductId) return "pending";
  return "synced";
}

function applyProductStatusFilter<T extends { not: Function; or: Function }>(
  queryBuilder: T,
  status: ProductStatusFilter
): T {
  if (status === "synced") {
    return queryBuilder.not("woo_product_id", "is", null).not("last_synced_at", "is", null) as T;
  }

  if (status === "pending") {
    return queryBuilder.or("woo_product_id.is.null,last_synced_at.is.null") as T;
  }

  return queryBuilder;
}

export async function getProducts(
  filters: ReturnType<typeof parseProductsSearchParams>
): Promise<ProductsListResult> {
  const empty: ProductsListResult = {
    products: [],
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
      .from("products")
      .select("id, sku, name, price, stock_quantity, image_url, woo_product_id, last_synced_at", {
        count: "exact"
      });

    if (filters.query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${filters.query}%,sku.ilike.%${filters.query}%`);
    }

    if (filters.stock === "out_of_stock") {
      queryBuilder = queryBuilder.eq("stock_quantity", 0);
    } else if (filters.stock === "low_stock") {
      queryBuilder = queryBuilder.gte("stock_quantity", 1).lte("stock_quantity", 10);
    } else if (filters.stock === "in_stock") {
      queryBuilder = queryBuilder.gt("stock_quantity", 10);
    }

    queryBuilder = applyProductStatusFilter(queryBuilder, filters.status);

    const { data, error, count } = await queryBuilder
      .order(filters.sort, { ascending: filters.sortDir === "asc" })
      .range(rangeFrom, rangeTo);

    if (error) {
      return { ...empty, errorMessage: "Unable to load products right now." };
    }

    const totalCount = count ?? 0;
    const { safePage } = getPaginationMeta(filters.page, filters.pageSize, totalCount);

    const products: ProductItem[] = (data ?? []).map((row) => ({
      id: row.id,
      thumbnailPath: row.image_url || "/product-placeholder.svg",
      sku: row.sku,
      name: row.name,
      price: Number(row.price ?? 0),
      stockQuantity: row.stock_quantity,
      syncStatus: buildSyncStatus(row.last_synced_at, row.woo_product_id),
      lastSyncedAt: row.last_synced_at
    }));

    return {
      products,
      totalCount,
      page: safePage,
      pageSize: filters.pageSize,
      sort: filters.sort,
      sortDir: filters.sortDir,
      errorMessage: null
    };
  } catch {
    return { ...empty, errorMessage: "Unable to load products right now." };
  }
}
