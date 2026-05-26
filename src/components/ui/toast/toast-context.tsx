"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { ToastInput, ToastItem, ToastVariant } from "@/components/ui/toast/types";

const DEFAULT_DURATIONS: Record<Exclude<ToastVariant, "loading">, number> = {
  success: 4000,
  error: 6000,
  warning: 5000
};

type ToastContextValue = {
  toasts: ToastItem[];
  success: (input: ToastInput) => string;
  error: (input: ToastInput) => string;
  warning: (input: ToastInput) => string;
  loading: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, input: ToastInput) => {
      const id = createToastId();
      const durationMs =
        variant === "loading" ? null : (input.durationMs ?? DEFAULT_DURATIONS[variant]);

      const toast: ToastItem = {
        id,
        variant,
        message: input.message,
        durationMs
      };

      setToasts((current) => [...current, toast]);

      if (durationMs !== null) {
        const timer = setTimeout(() => dismiss(id), durationMs);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      success: (input) => push("success", input),
      error: (input) => push("error", input),
      warning: (input) => push("warning", input),
      loading: (input) => push("loading", input),
      dismiss
    }),
    [dismiss, push, toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
