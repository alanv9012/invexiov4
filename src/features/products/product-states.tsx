import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";

export function ProductsLoadingState() {
  return <SkeletonTable rows={6} columns={4} />;
}

export function ProductsEmptyState() {
  return (
    <EmptyState
      title="No products found"
      description="Try adjusting your search or filters to find matching products."
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
