import { DashboardLayout } from "@/components/dashboard-layout";
import { OrdersSyncCard } from "@/features/sync/orders-sync-card";
import { ProductsSyncCard } from "@/features/sync/products-sync-card";
import { getSyncPageData } from "@/features/sync/queries";
import { SyncWooNotConfiguredAlert } from "@/features/sync/sync-woo-not-configured-alert";
import { SectionHeader } from "@/components/ui/section-header";

export default function SyncPage() {
  const { wooConfigured } = getSyncPageData();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <SectionHeader
          size="page"
          title="Sync"
          description="Synchronize products and orders between WooCommerce and Supabase."
        />
        {!wooConfigured ? <SyncWooNotConfiguredAlert /> : null}
        <ProductsSyncCard wooConfigured={wooConfigured} />
        <OrdersSyncCard wooConfigured={wooConfigured} />
      </div>
    </DashboardLayout>
  );
}
