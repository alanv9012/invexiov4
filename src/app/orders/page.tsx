import { DashboardLayout } from "@/components/dashboard-layout";
import { Alert } from "@/components/ui/alert";
import { PageContent } from "@/components/ui/page-content";
import { CreateOrderForm } from "@/features/orders/create-order-form";
import { OrdersEmptyState, OrdersErrorState } from "@/features/orders/order-states";
import { OrdersFilters } from "@/features/orders/orders-filters";
import { getOrders, getProductsForOrderForm, parseOrdersSearchParams } from "@/features/orders/queries";
import { OrdersTable } from "@/features/orders/orders-table";
import type { OrdersSearchParams } from "@/features/orders/types";
import { buildOrdersListParams } from "@/lib/ui/list-params";

type OrdersPageProps = {
  searchParams?: Promise<OrdersSearchParams>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolved = (searchParams ? await searchParams : {}) as OrdersSearchParams;
  const filters = parseOrdersSearchParams(resolved);
  const [result, { products: orderProducts, errorMessage: productsError }] = await Promise.all([
    getOrders(filters),
    getProductsForOrderForm()
  ]);
  const baseParams = buildOrdersListParams(filters);

  return (
    <DashboardLayout>
      <PageContent>
        {productsError ? (
          <Alert variant="warning" title="Manual orders unavailable">
            {productsError}
          </Alert>
        ) : null}
        <OrdersFilters
          query={filters.query}
          orderStatus={filters.orderStatus}
          source={filters.source}
          sync={filters.sync}
          sort={result.sort}
          sortDir={result.sortDir}
          action={<CreateOrderForm products={orderProducts} />}
        />
        {result.errorMessage ? <OrdersErrorState message={result.errorMessage} /> : null}
        {!result.errorMessage && result.totalCount === 0 ? <OrdersEmptyState /> : null}
        {!result.errorMessage && result.orders.length > 0 ? (
          <OrdersTable
            orders={result.orders}
            totalCount={result.totalCount}
            page={result.page}
            pageSize={result.pageSize}
            sort={result.sort}
            sortDir={result.sortDir}
            baseParams={baseParams}
          />
        ) : null}
      </PageContent>
    </DashboardLayout>
  );
}
