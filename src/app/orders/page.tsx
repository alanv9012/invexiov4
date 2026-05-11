import { DashboardLayout } from "@/components/dashboard-layout";
import { OrdersEmptyState, OrdersErrorState } from "@/features/orders/order-states";
import { OrdersFilters } from "@/features/orders/orders-filters";
import { getMockOrdersForPage } from "@/features/orders/orders-helpers";
import { OrdersTable } from "@/features/orders/orders-table";
import type { OrdersSearchParams } from "@/features/orders/types";

type OrdersPageProps = {
  searchParams?: Promise<OrdersSearchParams>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolved = (searchParams ? await searchParams : {}) as OrdersSearchParams;
  const forceError = first(resolved.error) === "1";

  if (forceError) {
    return (
      <DashboardLayout>
        <section className="space-y-4">
          <OrdersFilters
            query=""
            orderStatus="all"
            source="all"
            sync="all"
          />
          <OrdersErrorState message="Unable to load orders. Remove ?error=1 from the URL to continue." />
        </section>
      </DashboardLayout>
    );
  }

  const { orders, filters } = getMockOrdersForPage(resolved);

  return (
    <DashboardLayout>
      <section className="space-y-4">
        <OrdersFilters
          query={filters.query}
          orderStatus={filters.orderStatus}
          source={filters.source}
          sync={filters.sync}
        />
        {orders.length === 0 ? <OrdersEmptyState /> : <OrdersTable orders={orders} />}
      </section>
    </DashboardLayout>
  );
}
