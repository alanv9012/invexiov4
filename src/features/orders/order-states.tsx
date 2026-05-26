import { Alert } from "@/components/ui/alert";
import { DataTableSkeleton } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Button } from "@/components/ui/button";

export function OrdersLoadingState() {
  return (
    <LoadingRegion label="Loading orders">
      <DataTableSkeleton rows={10} columns={8} />
    </LoadingRegion>
  );
}

export function OrdersEmptyState() {
  return (
    <EmptyState
      title="No orders found"
      description="Try adjusting your search or filters, sync from WooCommerce, or create a manual order."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button href="/orders" variant="secondary" size="sm">
            Clear filters
          </Button>
          <Button href="/sync" size="sm">
            Open sync
          </Button>
        </div>
      }
    />
  );
}

type OrdersErrorStateProps = {
  message?: string;
};

export function OrdersErrorState({ message }: OrdersErrorStateProps) {
  return (
    <Alert variant="danger" title="Could not load orders">
      {message ?? "Something went wrong while loading orders. Please try again."}
    </Alert>
  );
}
