export function ProductsLoadingState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="h-10 rounded bg-slate-100" />
        <div className="h-10 rounded bg-slate-100" />
        <div className="h-10 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function ProductsEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
      <p className="mt-2 text-sm text-slate-600">
        Try adjusting your search or filters to find matching products.
      </p>
    </div>
  );
}

type ProductsErrorStateProps = {
  message?: string;
};

export function ProductsErrorState({ message }: ProductsErrorStateProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h3 className="text-lg font-semibold text-rose-800">Could not load products</h3>
      <p className="mt-2 text-sm text-rose-700">
        {message ?? "Something went wrong while loading product data. Please try again."}
      </p>
    </div>
  );
}
