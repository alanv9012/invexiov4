"use server";

import {
  searchProductsForPalette,
  type PaletteProduct
} from "@/features/products/palette-search";

export async function searchProductsForPaletteAction(
  query: string
): Promise<{ products: PaletteProduct[]; errorMessage: string | null }> {
  return searchProductsForPalette(query);
}
