import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";

export function OrdersLoadingState() {
  return <SkeletonTable rows={5} columns={5} />;
}

export function OrdersEmptyState() {
  return (
    <EmptyState
      title="No orders found"
      description="Try adjusting your search or filters, or create a manual order."
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
