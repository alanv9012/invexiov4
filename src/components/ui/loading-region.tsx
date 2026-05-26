import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type LoadingRegionProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function LoadingRegion({
  label = "Loading content",
  className,
  children,
  ...props
}: LoadingRegionProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("animate-fade-in", className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
