import { DashboardLayout } from "@/components/dashboard-layout";
import { ProductsSyncCard } from "@/features/sync/products-sync-card";

export default function SyncPage() {
  return (
    <DashboardLayout>
      <ProductsSyncCard />
    </DashboardLayout>
  );
}
