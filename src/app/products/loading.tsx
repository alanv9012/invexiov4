import { DashboardLayout } from "@/components/dashboard-layout";
import { ProductsLoadingState } from "@/features/products/product-states";

export default function ProductsLoadingPage() {
  return (
    <DashboardLayout>
      <ProductsLoadingState />
    </DashboardLayout>
  );
}
