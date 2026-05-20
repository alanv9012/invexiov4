import type { HTMLAttributes } from "react";
import { Sparkline } from "@/components/ui/charts/sparkline";
import { cn } from "@/lib/ui/cn";

export type MetricTone = "neutral" | "warning" | "danger" | "success";

const toneClasses: Record<MetricTone, { card: string; value: string; accent: string }> = {
  neutral: {
    card: "border-border bg-surface shadow-card",
    value: "text-foreground",
    accent: "stroke-primary"
  },
  warning: {
    card: "border-warning-border/80 bg-gradient-to-br from-warning-muted to-surface shadow-card",
    value: "text-warning-foreground",
    accent: "stroke-warning"
  },
  danger: {
    card: "border-danger-border/80 bg-gradient-to-br from-danger-muted to-surface shadow-card",
    value: "text-danger-foreground",
    accent: "stroke-danger"
  },
  success: {
    card: "border-success-border/80 bg-gradient-to-br from-success-muted to-surface shadow-card",
    value: "text-success-foreground",
    accent: "stroke-success"
  }
};

export type MetricTrend = {
  percentChange: number | null;
  direction: "up" | "down" | "flat";
  label: string;
};

export type MetricCardProps = HTMLAttributes<HTMLElement> & {
  label: string;
  value: number | string;
  hint?: string;
  tone?: MetricTone;
  trend?: MetricTrend;
  trendPositiveIsGood?: boolean;
  sparkline?: number[];
  icon?: React.ReactNode;
};

function TrendBadge({
  trend,
  positiveIsGood = true
}: {
  trend: MetricTrend;
  positiveIsGood?: boolean;
}) {
  const isUp = trend.direction === "up";
  const isDown = trend.direction === "down";
  const isGood = (isUp && positiveIsGood) || (isDown && !positiveIsGood);
  const isBad = (isUp && !positiveIsGood) || (isDown && positiveIsGood);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold",
        isGood && "bg-success-muted text-success-foreground",
        isBad && "bg-danger-muted text-danger-foreground",
        !isGood && !isBad && "bg-surface-muted text-muted-foreground"
      )}
    >
      {trend.percentChange != null ? (
        <>
          <span aria-hidden>{isUp ? "↑" : isDown ? "↓" : "→"}</span>
          {Math.abs(trend.percentChange)}%
        </>
      ) : trend.label ? (
        <span>{trend.label}</span>
      ) : null}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  trend,
  trendPositiveIsGood = true,
  sparkline,
  icon,
  className,
  ...props
}: MetricCardProps) {
  const styles = toneClasses[tone];

  return (
    <article
      className={cn("relative overflow-hidden rounded-card border p-card", styles.card, className)}
      {...props}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.03]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon ? <span className="text-muted-foreground">{icon}</span> : null}
            <p className="text-body-sm font-medium text-muted-foreground">{label}</p>
          </div>
          <p className={cn("mt-2 text-3xl font-semibold tracking-tight tabular-nums", styles.value)}>
            {value}
          </p>
          {(trend?.percentChange != null || trend?.label) ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {trend ? <TrendBadge trend={trend} positiveIsGood={trendPositiveIsGood} /> : null}
              {trend && trend.percentChange != null && trend.label ? (
                <span className="text-caption text-muted-foreground">{trend.label}</span>
              ) : null}
            </div>
          ) : null}
          {hint ? <p className="mt-1 text-caption text-muted-foreground">{hint}</p> : null}
        </div>
        {sparkline && sparkline.length > 0 ? (
          <Sparkline values={sparkline} strokeClassName={styles.accent} fillClassName="fill-primary/5" />
        ) : null}
      </div>
    </article>
  );
}
