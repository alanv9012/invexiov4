import { DashboardLayout } from "@/components/dashboard-layout";
import { ProductsView } from "@/features/products/products-view";

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <ProductsView />
    </DashboardLayout>
  );
}
