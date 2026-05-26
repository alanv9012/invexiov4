import { DashboardLayout } from "@/components/dashboard-layout";
import { PageContent } from "@/components/ui/page-content";
import { ProductsLoadingState } from "@/features/products/product-states";

export default function ProductsLoadingPage() {
  return (
    <DashboardLayout>
      <PageContent>
        <ProductsLoadingState />
      </PageContent>
    </DashboardLayout>
  );
}
