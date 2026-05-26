import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContent } from "@/components/ui/page-content";
import { SectionHeader } from "@/components/ui/section-header";

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <PageContent>
        <Card padding="lg">
          <SectionHeader
            size="page"
            title="Inventory"
            description="Stock adjustments and movement history are managed from the Products page. Every stock change is recorded in the inventory movements ledger."
            action={<Button href="/products">Go to Products</Button>}
          />
        </Card>
      </PageContent>
    </DashboardLayout>
  );
}
