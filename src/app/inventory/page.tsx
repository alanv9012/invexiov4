import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <Card padding="lg">
        <SectionHeader
          title="Inventory"
          description="Stock adjustments and movement history are managed from the Products page. Every stock change is recorded in the inventory movements ledger."
          action={<Button href="/products">Go to Products</Button>}
        />
      </Card>
    </DashboardLayout>
  );
}
