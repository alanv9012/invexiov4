import type { DashboardData } from "@/features/dashboard/types";
import { sparklineValues } from "@/features/dashboard/analytics";
import { MetricCard } from "@/components/ui/metric-card";

type DashboardMetricsProps = {
  data: DashboardData;
};

export function DashboardMetrics({ data }: DashboardMetricsProps) {
  const orderSparkline = sparklineValues(data.orderVolumeByDay);
  const movementSparkline = data.movementActivityByDay.map((point) => point.count);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Total products" value={data.totalProducts} hint="Active catalog SKUs" />
      <MetricCard
        label="Low stock"
        value={data.lowStockProducts}
        hint="1–10 units on hand"
        tone={data.lowStockProducts > 0 ? "warning" : "neutral"}
        trend={data.metricTrends.lowStock}
        trendPositiveIsGood={false}
      />
      <MetricCard
        label="Orders (7d)"
        value={data.recentOrdersCount}
        hint="Rolling 7-day volume"
        tone="neutral"
        trend={data.metricTrends.orders}
        sparkline={orderSparkline}
      />
      <MetricCard
        label="Failed syncs"
        value={data.failedSyncs}
        tone={data.failedSyncs > 0 ? "danger" : "neutral"}
        hint="All-time failed jobs"
        trendPositiveIsGood={false}
        trend={{
          percentChange: null,
          direction: data.failedSyncs > 0 ? "up" : "flat",
          label: data.failedSyncs > 0 ? "Needs attention" : "Healthy"
        }}
      />
      <MetricCard
        label="Movements today"
        value={data.movementsToday}
        hint="UTC calendar day"
        tone={data.movementsToday > 0 ? "success" : "neutral"}
        trend={data.metricTrends.movements}
        sparkline={movementSparkline}
      />
    </section>
  );
}
