import { DashboardLayout } from "@/components/dashboard-layout";
import { OrdersSyncCard } from "@/features/sync/orders-sync-card";
import { ProductsSyncCard } from "@/features/sync/products-sync-card";
import { getSyncPageData } from "@/features/sync/queries";
import { SyncWooNotConfiguredAlert } from "@/features/sync/sync-woo-not-configured-alert";

export default function SyncPage() {
  const { wooConfigured } = getSyncPageData();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {!wooConfigured ? <SyncWooNotConfiguredAlert /> : null}
        <ProductsSyncCard wooConfigured={wooConfigured} />
        <OrdersSyncCard wooConfigured={wooConfigured} />
      </div>
    </DashboardLayout>
  );
}
