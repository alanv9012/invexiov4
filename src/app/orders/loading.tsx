import { DashboardLayout } from "@/components/dashboard-layout";
import { OrdersLoadingState } from "@/features/orders/order-states";

export default function OrdersLoadingPage() {
  return (
    <DashboardLayout>
      <OrdersLoadingState />
    </DashboardLayout>
  );
}
