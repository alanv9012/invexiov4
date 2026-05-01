import type { ProductStatusFilter, ProductStockFilter } from "@/features/products/types";

type ProductsFiltersProps = {
  query: string;
  status: ProductStatusFilter;
  stock: ProductStockFilter;
};

export function ProductsFilters({ query, status, stock }: ProductsFiltersProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Products</h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse product records synced from your Supabase inventory table.
        </p>
      </div>

      <form method="get" className="grid gap-3 md:grid-cols-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name or SKU"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:col-span-2"
        />

        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="all">All sync statuses</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
        </select>

        <select
          name="stock"
          defaultValue={stock}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="all">All stock levels</option>
          <option value="in_stock">In stock (&gt; 10)</option>
          <option value="low_stock">Low stock (1-10)</option>
          <option value="out_of_stock">Out of stock (0)</option>
        </select>

        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Apply filters
          </button>
        </div>
      </form>
    </div>
  );
}
