import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type OrderFormProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
};

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
