"use client";

import { useMemo, useState } from "react";
import { MOCK_PRODUCTS } from "@/features/products/mock-products";
import {
  ProductsEmptyState,
  ProductsErrorState,
  ProductsLoadingState
} from "@/features/products/product-states";
import { ProductsTable } from "@/features/products/products-table";
import type { ProductItem, ProductStatusFilter, ProductStockFilter } from "@/features/products/types";

type DisplayMode = "data" | "loading" | "error";

function matchesStockFilter(product: ProductItem, stockFilter: ProductStockFilter): boolean {
  if (stockFilter === "all") return true;
  if (stockFilter === "out_of_stock") return product.stockQuantity === 0;
  if (stockFilter === "low_stock") return product.stockQuantity > 0 && product.stockQuantity <= 10;
  return product.stockQuantity > 10;
}

export function ProductsView() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>("all");
  const [mode, setMode] = useState<DisplayMode>("data");

  const filteredProducts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return MOCK_PRODUCTS.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || product.syncStatus === statusFilter;
      const matchesStock = matchesStockFilter(product, stockFilter);

      return matchesSearch && matchesStatus && matchesStock;
    });
  }, [searchValue, statusFilter, stockFilter]);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Products</h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse and filter product records using local mock data.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("data")}
              className={`rounded-md px-3 py-1.5 font-medium ${
                mode === "data" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => setMode("loading")}
              className={`rounded-md px-3 py-1.5 font-medium ${
                mode === "loading" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Loading
            </button>
            <button
              type="button"
              onClick={() => setMode("error")}
              className={`rounded-md px-3 py-1.5 font-medium ${
                mode === "error" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              Error
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by name or SKU"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ProductStatusFilter)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="all">All sync statuses</option>
            <option value="synced">Synced</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value as ProductStockFilter)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="all">All stock levels</option>
            <option value="in_stock">In stock (&gt; 10)</option>
            <option value="low_stock">Low stock (1-10)</option>
            <option value="out_of_stock">Out of stock (0)</option>
          </select>
        </div>
      </div>

      {mode === "loading" ? <ProductsLoadingState /> : null}
      {mode === "error" ? <ProductsErrorState /> : null}
      {mode === "data" && filteredProducts.length === 0 ? <ProductsEmptyState /> : null}
      {mode === "data" && filteredProducts.length > 0 ? (
        <ProductsTable products={filteredProducts} />
      ) : null}
    </section>
  );
}
