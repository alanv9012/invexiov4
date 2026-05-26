import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary/30",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-muted focus-visible:ring-border-strong/40",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-muted-foreground/20",
  danger:
    "bg-danger text-white hover:bg-danger-foreground focus-visible:ring-danger/30"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-sm"
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-button font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  href?: string;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  type = "button",
  disabled,
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}
