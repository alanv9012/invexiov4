import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type AlertVariant = "neutral" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<AlertVariant, string> = {
  neutral: "border-border bg-surface-muted text-foreground",
  success: "border-success-border bg-success-muted text-success-foreground",
  warning: "border-warning-border bg-warning-muted text-warning-foreground",
  danger: "border-danger-border bg-danger-muted text-danger-foreground",
  info: "border-info-border bg-info-muted text-info-foreground"
};

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
};

export function Alert({ className, variant = "neutral", title, children, ...props }: AlertProps) {
  return (
    <div
      role="status"
      className={cn("rounded-md border px-3 py-2 text-body-sm", variantClasses[variant], className)}
      {...props}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
