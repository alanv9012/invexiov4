import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import { StockLevelBadge } from "@/components/ui/inventory-badges";
import { stockThresholds } from "@/lib/ui/tokens";

export type HorizontalBarItem = {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  href?: string;
};

type HorizontalBarListProps = {
  items: HorizontalBarItem[];
  maxValue?: number;
  className?: string;
  emptyMessage?: string;
};

export function HorizontalBarList({
  items,
  maxValue,
  className,
  emptyMessage = "No low-stock products right now."
}: HorizontalBarListProps) {
  if (items.length === 0) {
    return (
      <p className={cn("rounded-lg border border-dashed border-border bg-surface-muted/50 px-4 py-8 text-center text-body-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    );
  }

  const ceiling = maxValue ?? Math.max(stockThresholds.lowStockMax, ...items.map((item) => item.value));

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const widthPercent = Math.max((item.value / ceiling) * 100, 6);
        const content = (
          <>
            <div className="mb-1 flex items-center justify-between gap-2 text-body-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{item.label}</p>
                {item.sublabel ? (
                  <p className="truncate font-mono text-caption text-muted-foreground">{item.sublabel}</p>
                ) : null}
              </div>
              <StockLevelBadge quantity={item.value} />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-warning transition-all duration-300"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="block rounded-md p-1 transition hover:bg-surface-muted">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
