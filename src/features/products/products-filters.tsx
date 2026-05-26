import type { ProductStatusFilter, ProductStockFilter } from "@/features/products/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchField } from "@/components/ui/data-table";
import { Select } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";

type ProductsFiltersProps = {
  query: string;
  status: ProductStatusFilter;
  stock: ProductStockFilter;
  sort?: string;
  sortDir?: string;
};

export function ProductsFilters({ query, status, stock, sort, sortDir }: ProductsFiltersProps) {
  const hasFilters = Boolean(query || status !== "all" || stock !== "all");

  return (
    <Card padding="md">
      <SectionHeader
        title="Products"
        description="Browse product records synced from your Supabase inventory table."
        className="mb-4"
      />

      <form method="get" className="grid gap-3 md:grid-cols-4">
        {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        {sortDir ? <input type="hidden" name="dir" value={sortDir} /> : null}

        <SearchField
          name="q"
          defaultValue={query}
          placeholder="Search by name or SKU…"
          className="md:col-span-2"
          aria-label="Search products"
        />

        <Select name="status" defaultValue={status} aria-label="Sync status filter">
          <option value="all">All sync statuses</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
        </Select>

        <Select name="stock" defaultValue={stock} aria-label="Stock level filter">
          <option value="all">All stock levels</option>
          <option value="in_stock">In stock (&gt; 10)</option>
          <option value="low_stock">Low stock (1-10)</option>
          <option value="out_of_stock">Out of stock (0)</option>
        </Select>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end md:col-span-4">
          {hasFilters ? (
            <Button href="/products" variant="secondary" className="w-full sm:w-auto">
              Clear
            </Button>
          ) : null}
          <Button type="submit" className="w-full sm:w-auto">
            Apply filters
          </Button>
        </div>
      </form>
    </Card>
  );
}
