import { DashboardLayout } from "@/components/dashboard-layout";
import { ProductsLoadingState } from "@/features/products/product-states";

export default function ProductsLoadingPage() {
  return (
    <DashboardLayout>
      <section className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-7 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>
        <ProductsLoadingState />
      </section>
    </DashboardLayout>
  );
}
