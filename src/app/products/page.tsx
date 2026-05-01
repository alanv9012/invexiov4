import { DashboardLayout } from "@/components/dashboard-layout";
import { ProductsEmptyState, ProductsErrorState } from "@/features/products/product-states";
import { ProductsFilters } from "@/features/products/products-filters";
import { getProducts, parseProductsSearchParams } from "@/features/products/queries";
import { ProductsTable } from "@/features/products/products-table";
import type { ProductsSearchParams } from "@/features/products/types";

type ProductsPageProps = {
  searchParams?: Promise<ProductsSearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = (searchParams ? await searchParams : {}) as ProductsSearchParams;
  const filters = parseProductsSearchParams(resolvedSearchParams);
  const { products, errorMessage } = await getProducts(filters);

  return (
    <DashboardLayout>
      <section className="space-y-4">
        <ProductsFilters query={filters.query} status={filters.status} stock={filters.stock} />
        {errorMessage ? <ProductsErrorState message={errorMessage} /> : null}
        {!errorMessage && products.length === 0 ? <ProductsEmptyState /> : null}
        {!errorMessage && products.length > 0 ? <ProductsTable products={products} /> : null}
      </section>
    </DashboardLayout>
  );
}
