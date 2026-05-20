import { cn } from "@/lib/ui/cn";

type SparklineProps = {
  values: number[];
  className?: string;
  strokeClassName?: string;
  fillClassName?: string;
  width?: number;
  height?: number;
};

export function Sparkline({
  values,
  className,
  strokeClassName = "stroke-primary",
  fillClassName = "fill-primary/10",
  width = 120,
  height = 36
}: SparklineProps) {
  if (values.length === 0) {
    return <div className={cn("h-9 w-full rounded bg-surface-muted", className)} aria-hidden />;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((value, index) => {
    const x = index * step;
    const normalized = (value - min) / range;
    const y = height - 4 - normalized * (height - 8);
    return `${x},${y}`;
  });

  const linePath = points.join(" ");
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-9 w-full max-w-[8rem]", className)}
      aria-hidden
    >
      <path d={areaPath} className={fillClassName} />
      <polyline
        points={linePath}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName}
      />
    </svg>
  );
}
