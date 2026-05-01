import "server-only";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductItem, ProductStatusFilter, ProductStockFilter, ProductsSearchParams } from "@/features/products/types";

const productsSearchSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["all", "synced", "pending"]).default("all"),
  stock: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).default("all")
});

export function parseProductsSearchParams(input: ProductsSearchParams): {
  query: string;
  status: ProductStatusFilter;
  stock: ProductStockFilter;
} {
  const getFirstValue = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  const parsed = productsSearchSchema.safeParse({
    q: getFirstValue(input.q),
    status: getFirstValue(input.status),
    stock: getFirstValue(input.stock)
  });

  if (!parsed.success) {
    return {
      query: "",
      status: "all",
      stock: "all"
    };
  }

  return {
    query: parsed.data.q ?? "",
    status: parsed.data.status,
    stock: parsed.data.stock
  };
}

function buildSyncStatus(lastSyncedAt: string | null, wooProductId: number | null): "synced" | "pending" {
  if (!lastSyncedAt || !wooProductId) return "pending";
  return "synced";
}

export async function getProducts(filters: {
  query: string;
  status: ProductStatusFilter;
  stock: ProductStockFilter;
}): Promise<{ products: ProductItem[]; errorMessage: string | null }> {
  try {
    const supabase = await getSupabaseServerClient();
    let queryBuilder = supabase
      .from("products")
      .select("id, sku, name, price, stock_quantity, image_url, woo_product_id, last_synced_at")
      .order("updated_at", { ascending: false });

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

    const { data, error } = await queryBuilder.limit(100);

    if (error) {
      return { products: [], errorMessage: "Unable to load products right now." };
    }

    const mappedProducts: ProductItem[] = (data ?? [])
      .map((row) => {
        const syncStatus = buildSyncStatus(row.last_synced_at, row.woo_product_id);

        return {
          id: row.id,
          thumbnailPath: row.image_url || "/product-placeholder.svg",
          sku: row.sku,
          name: row.name,
          price: Number(row.price ?? 0),
          stockQuantity: row.stock_quantity,
          syncStatus,
          lastSyncedAt: row.last_synced_at
        };
      })
      .filter((item) => filters.status === "all" || item.syncStatus === filters.status);

    return { products: mappedProducts, errorMessage: null };
  } catch {
    return { products: [], errorMessage: "Unable to load products right now." };
  }
}
