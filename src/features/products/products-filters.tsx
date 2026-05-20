import type { ProductStatusFilter, ProductStockFilter } from "@/features/products/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";

type ProductsFiltersProps = {
  query: string;
  status: ProductStatusFilter;
  stock: ProductStockFilter;
};

export function ProductsFilters({ query, status, stock }: ProductsFiltersProps) {
  return (
    <Card padding="md">
      <SectionHeader
        title="Products"
        description="Browse product records synced from your Supabase inventory table."
        className="mb-4"
      />

      <form method="get" className="grid gap-3 md:grid-cols-4">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search by name or SKU"
          className="md:col-span-2"
        />

        <Select name="status" defaultValue={status}>
          <option value="all">All sync statuses</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
        </Select>

        <Select name="stock" defaultValue={stock}>
          <option value="all">All stock levels</option>
          <option value="in_stock">In stock (&gt; 10)</option>
          <option value="low_stock">Low stock (1-10)</option>
          <option value="out_of_stock">Out of stock (0)</option>
        </Select>

        <div className="flex justify-end md:col-span-4">
          <Button type="submit">Apply filters</Button>
        </div>
      </form>
    </Card>
  );
}
