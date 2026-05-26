import type { ReactNode } from "react";
import type { OrderSource, OrderSyncStatus } from "@/features/orders/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchField } from "@/components/ui/data-table";
import { Select } from "@/components/ui/input";
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
  sort?: string;
  sortDir?: string;
  action?: ReactNode;
};

export function OrdersFilters({
  query,
  orderStatus,
  source,
  sync,
  sort,
  sortDir,
  action
}: OrdersFiltersProps) {
  const hasFilters = Boolean(
    query || orderStatus !== "all" || source !== "all" || sync !== "all"
  );

  return (
    <Card padding="md">
      <SectionHeader
        title="Orders"
        description="Review and filter orders synced from WooCommerce and created manually in Invexio."
        action={action}
        className="mb-4"
      />

      <form method="get" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        {sortDir ? <input type="hidden" name="dir" value={sortDir} /> : null}

        <SearchField
          name="q"
          defaultValue={query}
          placeholder="Search order #, customer, or status…"
          className="lg:col-span-2"
          aria-label="Search orders"
        />

        <Select name="status" defaultValue={orderStatus} aria-label="Order status filter">
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All order statuses" : s.replace("-", " ")}
            </option>
          ))}
        </Select>

        <Select name="source" defaultValue={source} aria-label="Order source filter">
          <option value="all">All sources</option>
          <option value="manual">Manual</option>
          <option value="woocommerce">WooCommerce</option>
          <option value="system">System</option>
        </Select>

        <Select name="sync" defaultValue={sync} className="md:col-span-2 lg:col-span-1" aria-label="Sync status filter">
          <option value="all">All sync statuses</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </Select>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end md:col-span-2 lg:col-span-4">
          {hasFilters ? (
            <Button href="/orders" variant="secondary" className="w-full sm:w-auto">
              Clear
            </Button>
          ) : null}
          <Button type="submit" className="w-full sm:w-auto">
            Apply filters
          </Button>
        </div>
      </form>
    </Card>
  );
}
