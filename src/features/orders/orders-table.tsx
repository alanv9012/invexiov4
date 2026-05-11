import type { OrderRow, OrderSource, OrderSyncStatus } from "@/features/orders/types";

type OrdersTableProps = {
  orders: OrderRow[];
};

const syncStyles: Record<OrderSyncStatus, string> = {
  synced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200"
};

const sourceLabels: Record<OrderSource, string> = {
  manual: "Manual",
  woocommerce: "WooCommerce",
  system: "System"
};

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Order #</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Sync</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="text-sm text-slate-700">
              <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                {order.orderNumber}
              </td>
              <td className="px-4 py-3 text-slate-900">{order.customerName}</td>
              <td className="px-4 py-3 capitalize">{order.status.replace("-", " ")}</td>
              <td className="px-4 py-3">{formatMoney(order.total, order.currency)}</td>
              <td className="px-4 py-3">{sourceLabels[order.source]}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${syncStyles[order.syncStatus]}`}
                >
                  {order.syncStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
