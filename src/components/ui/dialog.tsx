"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useEscapeKey } from "@/lib/ui/use-escape-key";
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
  /** Submit the nearest form on Enter (skips textareas). */
  submitOnEnter?: boolean;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "modal",
  className,
  submitOnEnter = false
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEscapeKey(onClose, open);

  const handleEnterSubmit = useCallback(
    (event: KeyboardEvent) => {
      if (!submitOnEnter || event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName === "TEXTAREA") return;

      const form = target.closest("form");
      if (!form || !panelRef.current?.contains(form)) return;

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (!submitButton || submitButton.disabled) return;

      event.preventDefault();
      form.requestSubmit();
    },
    [submitOnEnter]
  );

  useEffect(() => {
    if (!open || !submitOnEnter) return;
    window.addEventListener("keydown", handleEnterSubmit);
    return () => window.removeEventListener("keydown", handleEnterSubmit);
  }, [handleEnterSubmit, open, submitOnEnter]);

  if (!open) return null;

  const isDrawer = variant === "drawer";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex animate-fade-in bg-black/40 backdrop-blur-[1px]",
        isDrawer ? "items-stretch justify-stretch p-0 sm:items-center sm:justify-end sm:p-4" : "items-end justify-center p-0 sm:items-center sm:p-4"
      )}
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "flex max-h-[100dvh] w-full animate-slide-up flex-col border border-border bg-surface shadow-drawer motion-reduce:animate-none",
          isDrawer
            ? "h-[100dvh] max-w-none rounded-none sm:ml-auto sm:h-full sm:max-h-[100dvh] sm:max-w-md sm:rounded-card"
            : "max-h-[92dvh] rounded-t-card sm:m-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-card",
          "p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 sm:shadow-modal",
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 id="dialog-title" className="text-title text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0"
          >
            Close
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

        {footer ? (
          <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end [&_button]:w-full sm:[&_button]:w-auto">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
