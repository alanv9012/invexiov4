import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "primary";
export type BadgeSize = "sm" | "md";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-muted text-muted-foreground",
  success: "border-success-border bg-success-muted text-success-foreground",
  warning: "border-warning-border bg-warning-muted text-warning-foreground",
  danger: "border-danger-border bg-danger-muted text-danger-foreground",
  info: "border-info-border bg-info-muted text-info-foreground",
  primary: "border-primary/20 bg-primary/5 text-primary"
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs"
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
};

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold capitalize",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
