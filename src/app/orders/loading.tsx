import { DashboardLayout } from "@/components/dashboard-layout";
import { PageContent } from "@/components/ui/page-content";
import { OrdersLoadingState } from "@/features/orders/order-states";

export default function OrdersLoadingPage() {
  return (
    <DashboardLayout>
      <PageContent>
        <OrdersLoadingState />
      </PageContent>
    </DashboardLayout>
  );
}
