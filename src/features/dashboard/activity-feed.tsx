import Link from "next/link";
import type { DashboardActivityItem } from "@/features/dashboard/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge } from "@/components/ui/inventory-badges";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

type ActivityFeedProps = {
  items: DashboardActivityItem[];
};

function ActivityIcon({ type }: { type: DashboardActivityItem["type"] }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
        type === "order"
          ? "border-info-border bg-info-muted text-info-foreground"
          : "border-success-border bg-success-muted text-success-foreground"
      )}
      aria-hidden
    >
      {type === "order" ? "O" : "M"}
    </span>
  );
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest orders and inventory movements across your store</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button href="/orders" variant="secondary" size="sm">
            Orders
          </Button>
          <Button href="/products" variant="secondary" size="sm">
            Products
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No activity yet"
            description="Orders and stock adjustments will appear here as your team uses Invexio."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button href="/sync" size="sm">
                  Run sync
                </Button>
                <Button href="/orders" variant="secondary" size="sm">
                  View orders
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-1">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link
                href={item.type === "order" ? "/orders" : "/products"}
                className="flex gap-3 rounded-lg p-3 transition hover:bg-surface-muted"
              >
                <ActivityIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <time className="text-caption text-muted-foreground" dateTime={item.timestamp}>
                      {formatDateTime(item.timestamp)}
                    </time>
                  </div>
                  <p className="mt-0.5 truncate text-body-sm text-muted-foreground">{item.subtitle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.type === "order" ? (
                      <>
                        <OrderStatusBadge status={item.status} />
                        <span className="text-body-sm font-medium tabular-nums text-foreground">
                          {formatMoney(item.amount)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className={cn(
                            "text-body-sm font-semibold tabular-nums",
                            item.changeQuantity >= 0
                              ? "text-success-foreground"
                              : "text-danger-foreground"
                          )}
                        >
                          {item.changeQuantity >= 0 ? "+" : ""}
                          {item.changeQuantity} units
                        </span>
                        <span className="text-caption capitalize text-muted-foreground">{item.source}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
