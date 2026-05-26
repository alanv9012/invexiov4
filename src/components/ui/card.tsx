import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "muted" | "dashed";
};

const paddingClasses = {
  none: "",
  sm: "p-3 sm:p-card-sm",
  md: "p-4 sm:p-card",
  lg: "p-5 sm:p-8"
};

const variantClasses = {
  default: "border-border bg-surface shadow-card transition-shadow duration-150",
  muted: "border-border bg-surface-muted",
  dashed: "border-dashed border-border-strong bg-surface"
};

export function Card({
  className,
  padding = "md",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-title text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-sm text-muted-foreground", className)} {...props} />;
}
