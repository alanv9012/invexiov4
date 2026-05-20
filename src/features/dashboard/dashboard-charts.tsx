import type { DashboardData } from "@/features/dashboard/types";
import { BarChart } from "@/components/ui/charts/bar-chart";
import { HorizontalBarList } from "@/components/ui/charts/horizontal-bar-list";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { DASHBOARD_CHART_DAYS } from "@/features/dashboard/analytics";

type DashboardChartsProps = {
  data: DashboardData;
};

export function DashboardCharts({ data }: DashboardChartsProps) {
  const orderBars = data.orderVolumeByDay.map((point) => ({
    label: point.label,
    value: point.count
  }));

  const movementBars = data.movementActivityByDay.map((point) => ({
    label: point.label,
    value: point.count
  }));

  const lowStockBars = data.lowStockItems.map((product) => ({
    id: product.id,
    label: product.name,
    sublabel: product.sku,
    value: product.stockQuantity,
    href: `/products?q=${encodeURIComponent(product.sku)}`
  }));

  const totalMovementEvents = data.movementActivityByDay.reduce((sum, point) => sum + point.count, 0);
  const netStockChange = data.movementActivityByDay.reduce((sum, point) => sum + point.netChange, 0);
  const totalOrders = data.orderVolumeByDay.reduce((sum, point) => sum + point.count, 0);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card padding="md" className="lg:col-span-1">
        <CardTitle>Order volume</CardTitle>
        <CardDescription>
          {totalOrders} orders in the last {DASHBOARD_CHART_DAYS} days
        </CardDescription>
        <div className="mt-4">
          <BarChart
            data={orderBars}
            barClassName="fill-primary/85"
            emptyMessage="No orders in the last week. Sync or create manual orders to see volume."
          />
        </div>
      </Card>

      <Card padding="md" className="lg:col-span-1">
        <CardTitle>Inventory movement activity</CardTitle>
        <CardDescription>
          {totalMovementEvents} adjustments · net {netStockChange >= 0 ? "+" : ""}
          {netStockChange} units ({DASHBOARD_CHART_DAYS}d)
        </CardDescription>
        <div className="mt-4">
          <BarChart
            data={movementBars}
            barClassName="fill-success/80"
            emptyMessage="No inventory movements yet. Adjust stock from Products to populate this chart."
          />
        </div>
      </Card>

      <Card padding="md" className="lg:col-span-1">
        <CardTitle>Low stock products</CardTitle>
        <CardDescription>
          Top SKUs between 1–10 units ({data.lowStockProducts} total)
        </CardDescription>
        <div className="mt-4">
          <HorizontalBarList
            items={lowStockBars}
            emptyMessage="No low-stock products. Inventory levels look healthy."
          />
        </div>
      </Card>
    </section>
  );
}
