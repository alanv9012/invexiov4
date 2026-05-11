import type { OrderSource, OrderSyncStatus } from "@/features/orders/types";

const ORDER_STATUSES = [
  "all",
  "pending",
  "processing",
  "on-hold",
  "completed",
  "cancelled",
  "refunded"
] as const;

type OrdersFiltersProps = {
  query: string;
  orderStatus: string;
  source: "all" | OrderSource;
  sync: "all" | OrderSyncStatus;
};

export function OrdersFilters({ query, orderStatus, source, sync }: OrdersFiltersProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Orders</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review orders with mock data. WooCommerce order sync is not enabled yet.
        </p>
      </div>

      <form method="get" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by number, customer, or status"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 lg:col-span-2"
        />

        <select
          name="status"
          defaultValue={orderStatus}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All order statuses" : s.replace("-", " ")}
            </option>
          ))}
        </select>

        <select
          name="source"
          defaultValue={source}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="all">All sources</option>
          <option value="manual">Manual</option>
          <option value="woocommerce">WooCommerce</option>
          <option value="system">System</option>
        </select>

        <select
          name="sync"
          defaultValue={sync}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:col-span-2 lg:col-span-1"
        >
          <option value="all">All sync statuses</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <div className="flex justify-end md:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Apply filters
          </button>
        </div>
      </form>
    </div>
  );
}
