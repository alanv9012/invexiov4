import type { ProductSyncStatus } from "@/features/products/types";
import type { OrderSyncStatus } from "@/features/orders/types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { getStockLevel, type StockLevel } from "@/lib/ui/tokens";

const productSyncVariants: Record<ProductSyncStatus, BadgeVariant> = {
  synced: "success",
  pending: "warning"
};

const orderSyncVariants: Record<OrderSyncStatus, BadgeVariant> = {
  synced: "success",
  pending: "warning",
  failed: "danger"
};

const stockLabels: Record<StockLevel, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock"
};

const stockVariants: Record<StockLevel, BadgeVariant> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger"
};

export function ProductSyncStatusBadge({ status }: { status: ProductSyncStatus }) {
  return (
    <Badge variant={productSyncVariants[status]} size="md">
      {status}
    </Badge>
  );
}

export function OrderSyncStatusBadge({ status }: { status: OrderSyncStatus }) {
  return (
    <Badge variant={orderSyncVariants[status]} size="md">
      {status}
    </Badge>
  );
}

export function StockLevelBadge({ quantity }: { quantity: number }) {
  const level = getStockLevel(quantity);
  return (
    <Badge variant={stockVariants[level]} size="md">
      {stockLabels[level]}
    </Badge>
  );
}

export function StockQuantityCell({ quantity }: { quantity: number }) {
  const level = getStockLevel(quantity);

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium tabular-nums text-foreground">{quantity}</span>
      {level !== "in_stock" ? <StockLevelBadge quantity={quantity} /> : null}
    </div>
  );
}

const orderStatusVariants: Record<string, BadgeVariant> = {
  pending: "warning",
  processing: "info",
  "on-hold": "warning",
  completed: "success",
  cancelled: "neutral",
  refunded: "neutral",
  failed: "danger"
};

export function OrderStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant = orderStatusVariants[normalized] ?? "neutral";
  const label = status.replace(/-/g, " ");

  return (
    <Badge variant={variant} size="md">
      {label}
    </Badge>
  );
}

type SyncLogStatus = "success" | "failed" | "running" | "queued" | string;

const syncLogVariants: Record<string, BadgeVariant> = {
  success: "success",
  failed: "danger",
  running: "warning",
  queued: "neutral"
};

export function SyncLogStatusBadge({
  type,
  status,
  count
}: {
  type: string;
  status: SyncLogStatus;
  count?: number;
}) {
  const variant = syncLogVariants[status] ?? "neutral";

  return (
    <Badge variant={variant} className="gap-2 capitalize">
      {type} · {status}
      {typeof count === "number" ? (
        <span className="rounded-full bg-surface/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
          {count}
        </span>
      ) : null}
    </Badge>
  );
}
