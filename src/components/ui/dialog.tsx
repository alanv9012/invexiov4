"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { Button } from "@/components/ui/button";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "modal" | "drawer";
  className?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "modal",
  className
}: DialogProps) {
  if (!open) return null;

  const isDrawer = variant === "drawer";

  return (
    <div className="fixed inset-0 z-40 flex bg-black/30 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "flex max-h-full flex-col border border-border bg-surface shadow-drawer",
          isDrawer
            ? "ml-auto h-full w-full max-w-md rounded-card p-5"
            : "m-auto w-full max-w-lg rounded-card p-6 shadow-modal",
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="dialog-title" className="text-title text-foreground">
              {title}
            </h2>
            {description ? <p className="mt-1 text-body-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-border pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
