type OrdersErrorStateProps = {
  message?: string;
};

export function OrdersLoadingState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="h-10 rounded bg-slate-100" />
        <div className="h-10 rounded bg-slate-100" />
        <div className="h-32 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function OrdersEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">No orders found</h3>
      <p className="mt-2 text-sm text-slate-600">
        Try adjusting your search or filters, or create a manual order.
      </p>
    </div>
  );
}

export function OrdersErrorState({ message }: OrdersErrorStateProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h3 className="text-lg font-semibold text-rose-800">Could not load orders</h3>
      <p className="mt-2 text-sm text-rose-700">
        {message ?? "Something went wrong while loading orders. Please try again."}
      </p>
    </div>
  );
}
