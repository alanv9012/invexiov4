import type { OrderSource, OrderSyncStatus } from "@/features/orders/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";

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
    <Card padding="md">
      <SectionHeader
        title="Orders"
        description="Review and filter orders synced from WooCommerce and created manually in Invexio."
        className="mb-4"
      />

      <form method="get" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search by number, customer, or status"
          className="lg:col-span-2"
        />

        <Select name="status" defaultValue={orderStatus}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All order statuses" : s.replace("-", " ")}
            </option>
          ))}
        </Select>

        <Select name="source" defaultValue={source}>
          <option value="all">All sources</option>
          <option value="manual">Manual</option>
          <option value="woocommerce">WooCommerce</option>
          <option value="system">System</option>
        </Select>

        <Select name="sync" defaultValue={sync} className="md:col-span-2 lg:col-span-1">
          <option value="all">All sync statuses</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </Select>

        <div className="flex justify-end md:col-span-2 lg:col-span-4">
          <Button type="submit">Apply filters</Button>
        </div>
      </form>
    </Card>
  );
}
