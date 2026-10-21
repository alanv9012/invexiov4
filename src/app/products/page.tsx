import { DashboardLayout } from "@/components/dashboard-layout";
import { PageContent } from "@/components/ui/page-content";
import { ProductsEmptyState, ProductsErrorState } from "@/features/products/product-states";
import { ProductsFilters } from "@/features/products/products-filters";
import { getProducts, parseProductsSearchParams } from "@/features/products/queries";
import { ProductsTable } from "@/features/products/products-table";
import type { ProductsSearchParams } from "@/features/products/types";
import { buildProductsListParams } from "@/lib/ui/list-params";
import { currentUserHasPermission } from "@/server/auth/authorization";

type ProductsPageProps = {
  searchParams?: Promise<ProductsSearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = (searchParams ? await searchParams : {}) as ProductsSearchParams;
  const filters = parseProductsSearchParams(resolvedSearchParams);
  const [result, canAdjustInventory] = await Promise.all([
    getProducts(filters),
    currentUserHasPermission("inventory.adjust")
  ]);
  const baseParams = buildProductsListParams(filters);

  return (
    <DashboardLayout>
      <PageContent>
        <ProductsFilters
          query={filters.query}
          status={filters.status}
          stock={filters.stock}
          sort={result.sort}
          sortDir={result.sortDir}
        />
        {result.errorMessage ? <ProductsErrorState message={result.errorMessage} /> : null}
        {!result.errorMessage && result.totalCount === 0 ? <ProductsEmptyState /> : null}
        {!result.errorMessage && result.products.length > 0 ? (
          <ProductsTable
            products={result.products}
            totalCount={result.totalCount}
            page={result.page}
            pageSize={result.pageSize}
            sort={result.sort}
            sortDir={result.sortDir}
            baseParams={baseParams}
            canAdjustInventory={canAdjustInventory}
          />
        ) : null}
      </PageContent>
    </DashboardLayout>
  );
}
