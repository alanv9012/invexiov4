import { cn } from "@/lib/ui/cn";

export type BarChartPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartPoint[];
  className?: string;
  barClassName?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
};

export function BarChart({
  data,
  className,
  barClassName = "fill-primary/80",
  height = 160,
  valueFormatter = (value) => String(value),
  emptyMessage = "No data for this period."
}: BarChartProps) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const chartWidth = 100;
  const barGap = data.length > 1 ? chartWidth / data.length : chartWidth;
  const barWidth = Math.min(barGap * 0.62, 12);
  const hasData = data.some((point) => point.value > 0);

  if (!hasData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/50 text-body-sm text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Bar chart"
      >
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * (height - 28);
          const x = index * barGap + (barGap - barWidth) / 2;
          const y = height - 20 - barHeight;

          return (
            <g key={`${point.label}-${index}`}>
              <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={2}
                className={barClassName}
              />
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[4px] font-medium"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
