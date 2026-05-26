"use client";

import { useToast } from "@/components/ui/toast/toast-context";
import type { ToastVariant } from "@/components/ui/toast/types";
import { cn } from "@/lib/ui/cn";

const variantStyles: Record<ToastVariant, string> = {
  success: "border-success-border bg-success-muted text-success-foreground",
  error: "border-danger-border bg-danger-muted text-danger-foreground",
  warning: "border-warning-border bg-warning-muted text-warning-foreground",
  loading: "border-border bg-surface text-foreground"
};

const variantLabels: Record<ToastVariant, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  loading: "Loading"
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "loading") {
    return (
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        aria-hidden
      />
    );
  }

  const symbols: Record<Exclude<ToastVariant, "loading">, string> = {
    success: "✓",
    error: "✕",
    warning: "!"
  };

  return (
    <span className="text-sm font-bold" aria-hidden>
      {symbols[variant]}
    </span>
  );
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm sm:p-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex animate-slide-up items-start gap-3 rounded-lg border px-4 py-3 text-body-sm shadow-modal motion-reduce:animate-none",
            variantStyles[toast.variant]
          )}
        >
          <ToastIcon variant={toast.variant} />
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold uppercase tracking-wide opacity-80">
              {variantLabels[toast.variant]}
            </p>
            <p className="mt-0.5 leading-snug">{toast.message}</p>
          </div>
          {toast.variant !== "loading" ? (
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md px-1.5 py-0.5 text-caption opacity-70 transition hover:bg-black/5 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
