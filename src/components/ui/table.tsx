import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

type TableContainerProps = HTMLAttributes<HTMLDivElement> & {
  stickyHeader?: boolean;
  maxHeight?: string;
};

export function TableContainer({
  className,
  stickyHeader = false,
  maxHeight = "70vh",
  children,
  ...props
}: TableContainerProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-card border border-border bg-surface shadow-card", className)}
      {...props}
    >
      <div
        className={cn("overflow-x-auto", stickyHeader && "overflow-y-auto")}
        style={stickyHeader ? { maxHeight } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

type TableFrameProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  stickyHeader?: boolean;
  maxHeight?: string;
  className?: string;
};

export function TableFrame({
  children,
  footer,
  stickyHeader = true,
  maxHeight = "70vh",
  className
}: TableFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface shadow-card",
        className
      )}
    >
      <div
        className={cn("overflow-x-auto", stickyHeader && "overflow-y-auto")}
        style={stickyHeader ? { maxHeight } : undefined}
      >
        {children}
      </div>
      {footer}
    </div>
  );
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("min-w-full border-collapse text-body-sm", className)} {...props} />;
}

type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement> & {
  sticky?: boolean;
};

export function TableHeader({ className, sticky, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn(
        "bg-surface-muted",
        sticky && "sticky top-0 z-10 shadow-[0_1px_0_0_rgb(var(--color-border))]",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border/60 bg-surface", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "group text-foreground transition-colors duration-150 hover:bg-surface-muted/70",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap bg-surface-muted px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle", className)} {...props} />;
}

export function TableActionsCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <TableCell
      className={cn("text-right", className)}
      {...props}
    />
  );
}
