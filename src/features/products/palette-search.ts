import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PaletteProduct = {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
};

const MAX_QUERY_LENGTH = 80;
const MAX_RESULTS = 12;

export async function searchProductsForPalette(query: string): Promise<{
  products: PaletteProduct[];
  errorMessage: string | null;
}> {
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);

  if (trimmed.length < 1) {
    return { products: [], errorMessage: null };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, stock_quantity")
      .or(`name.ilike.%${trimmed}%,sku.ilike.%${trimmed}%`)
      .order("name", { ascending: true })
      .limit(MAX_RESULTS);

    if (error) {
      return { products: [], errorMessage: "Unable to search products right now." };
    }

    return {
      products: (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        stockQuantity: row.stock_quantity
      })),
      errorMessage: null
    };
  } catch {
    return { products: [], errorMessage: "Unable to search products right now." };
  }
}
