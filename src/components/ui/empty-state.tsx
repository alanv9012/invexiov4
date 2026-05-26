import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { Card } from "@/components/ui/card";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Nested inside another card — lighter chrome, no double border. */
  variant?: "card" | "inline";
};

function EmptyIcon() {
  return (
    <span
      className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-border-strong bg-surface-muted text-muted-foreground"
      aria-hidden
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
  variant = "card"
}: EmptyStateProps) {
  const content = (
    <>
      <EmptyIcon />
      <h3 className="text-title text-foreground">{title}</h3>
      {description ? <p className="mt-2 text-body-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </>
  );

  if (variant === "inline") {
    return (
      <div
        role="status"
        className={cn(
          "animate-fade-in rounded-lg border border-dashed border-border-strong bg-surface-muted/50 px-4 py-8 text-center",
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Card
      variant="dashed"
      padding="lg"
      role="status"
      className={cn("animate-fade-in text-center", className)}
    >
      {content}
    </Card>
  );
}
