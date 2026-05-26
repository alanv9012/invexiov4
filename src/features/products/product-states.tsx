import { Alert } from "@/components/ui/alert";
import { DataTableSkeleton } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Button } from "@/components/ui/button";

export function ProductsLoadingState() {
  return (
    <LoadingRegion label="Loading products">
      <DataTableSkeleton rows={10} columns={7} />
    </LoadingRegion>
  );
}

export function ProductsEmptyState() {
  return (
    <EmptyState
      title="No products found"
      description="Try adjusting your search or filters, or sync products from WooCommerce."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button href="/sync" size="sm">
            Open sync
          </Button>
          <Button href="/products" variant="secondary" size="sm">
            Clear filters
          </Button>
        </div>
      }
    />
  );
}

type ProductsErrorStateProps = {
  message?: string;
};

export function ProductsErrorState({ message }: ProductsErrorStateProps) {
  return (
    <Alert variant="danger" title="Could not load products">
      {message ?? "Something went wrong while loading product data. Please try again."}
    </Alert>
  );
}
