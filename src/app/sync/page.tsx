import { DashboardLayout } from "@/components/dashboard-layout";
import { OrdersSyncCard } from "@/features/sync/orders-sync-card";
import { ProductsSyncCard } from "@/features/sync/products-sync-card";

export default function SyncPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <ProductsSyncCard />
        <OrdersSyncCard />
      </div>
    </DashboardLayout>
  );
}
