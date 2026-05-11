import { DashboardLayout } from "@/components/dashboard-layout";
import { OrdersLoadingState } from "@/features/orders/order-states";

export default function OrdersLoadingPage() {
  return (
    <DashboardLayout>
      <section className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
        <OrdersLoadingState />
      </section>
    </DashboardLayout>
  );
}
