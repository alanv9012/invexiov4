import type { DashboardData } from "@/features/dashboard/types";

type DashboardContentProps = {
  data: DashboardData;
};

function MetricCard({
  label,
  value,
  hint,
  tone = "neutral"
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const toneClasses = {
    neutral: "border-slate-200 bg-white",
    warning: "border-amber-200 bg-amber-50",
    danger: "border-rose-200 bg-rose-50",
    success: "border-emerald-200 bg-emerald-50"
  };

  const valueClasses = {
    neutral: "text-slate-900",
    warning: "text-amber-800",
    danger: "text-rose-800",
    success: "text-emerald-800"
  };

  return (
    <article className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${valueClasses[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );
}

const syncStatusStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  running: "bg-amber-50 text-amber-700 border-amber-200",
  queued: "bg-slate-50 text-slate-600 border-slate-200"
};

export function DashboardContent({ data }: DashboardContentProps) {
  if (data.errorMessage) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-800">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-rose-700">{data.errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Live overview of inventory, orders, and sync activity from Supabase.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total products" value={data.totalProducts} />
        <MetricCard
          label="Low stock"
          value={data.lowStockProducts}
          hint="1–10 units on hand"
          tone={data.lowStockProducts > 0 ? "warning" : "neutral"}
        />
        <MetricCard label="Recent orders" value={data.recentOrdersCount} hint="Last 7 days" />
        <MetricCard
          label="Failed syncs"
          value={data.failedSyncs}
          tone={data.failedSyncs > 0 ? "danger" : "neutral"}
        />
        <MetricCard
          label="Movements today"
          value={data.movementsToday}
          hint="UTC day"
          tone={data.movementsToday > 0 ? "success" : "neutral"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent orders</h3>
          {data.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {order.orderNumber ?? order.id.slice(0, 8)}
                    </p>
                    <p className="text-slate-600">{order.customerName ?? "No customer name"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatMoney(order.totalAmount)}</p>
                    <p className="capitalize text-slate-500">{order.status.replace("-", " ")}</p>
                    <p className="text-xs text-slate-400">{formatDate(order.orderedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent inventory movements</h3>
          {data.recentMovements.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No inventory movements yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.recentMovements.map((movement) => (
                <li key={movement.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{movement.productName}</p>
                      <p className="text-slate-600">{movement.reason}</p>
                    </div>
                    <p
                      className={`font-semibold ${
                        movement.changeQuantity >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {movement.changeQuantity >= 0 ? "+" : ""}
                      {movement.changeQuantity}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {movement.source} · {formatDate(movement.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-900">Sync status summary</h3>
        <p className="mt-1 text-sm text-slate-600">Counts from the 100 most recent sync log entries.</p>
        {data.syncSummary.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No sync activity recorded yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.syncSummary.map((item) => (
              <span
                key={`${item.type}-${item.status}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                  syncStatusStyles[item.status] ?? syncStatusStyles.queued
                }`}
              >
                {item.type} · {item.status}
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold">
                  {item.count}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
