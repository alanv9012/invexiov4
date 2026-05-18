import { DashboardLayout } from "@/components/dashboard-layout";
import { CreateOrderForm } from "@/features/orders/create-order-form";
import { OrdersEmptyState, OrdersErrorState } from "@/features/orders/order-states";
import { OrdersFilters } from "@/features/orders/orders-filters";
import { getOrders, getProductsForOrderForm, parseOrdersSearchParams } from "@/features/orders/queries";
import { OrdersTable } from "@/features/orders/orders-table";
import type { OrdersSearchParams } from "@/features/orders/types";

type OrdersPageProps = {
  searchParams?: Promise<OrdersSearchParams>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolved = (searchParams ? await searchParams : {}) as OrdersSearchParams;
  const filters = parseOrdersSearchParams(resolved);
  const [{ orders, errorMessage }, { products: orderProducts, errorMessage: productsError }] =
    await Promise.all([getOrders(filters), getProductsForOrderForm()]);

  return (
    <DashboardLayout>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <CreateOrderForm products={orderProducts} />
        </div>
        {productsError ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {productsError}
          </p>
        ) : null}
        <OrdersFilters
          query={filters.query}
          orderStatus={filters.orderStatus}
          source={filters.source}
          sync={filters.sync}
        />
        {errorMessage ? <OrdersErrorState message={errorMessage} /> : null}
        {!errorMessage && orders.length === 0 ? <OrdersEmptyState /> : null}
        {!errorMessage && orders.length > 0 ? <OrdersTable orders={orders} /> : null}
      </section>
    </DashboardLayout>
  );
}
