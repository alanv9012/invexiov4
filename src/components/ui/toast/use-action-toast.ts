"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast/toast-context";

export type ActionToastStatus = "idle" | "success" | "error" | "warning";

export type ActionToastState = {
  status: ActionToastStatus | string;
  message: string | null;
};

type UseActionToastOptions = {
  pending?: boolean;
  loadingMessage?: string;
  enabled?: boolean;
};

export function useActionToast(
  state: ActionToastState,
  { pending = false, loadingMessage = "Working…", enabled = true }: UseActionToastOptions = {}
) {
  const toast = useToast();
  const previousStatus = useRef(state.status);
  const loadingToastId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (pending) {
      if (!loadingToastId.current) {
        loadingToastId.current = toast.loading({ message: loadingMessage });
      }
      return;
    }

    if (loadingToastId.current) {
      toast.dismiss(loadingToastId.current);
      loadingToastId.current = null;
    }
  }, [enabled, loadingMessage, pending, toast]);

  useEffect(() => {
    if (!enabled) return;

    if (state.status === previousStatus.current) return;
    previousStatus.current = state.status;

    if (state.status === "idle" || !state.message) return;

    if (loadingToastId.current) {
      toast.dismiss(loadingToastId.current);
      loadingToastId.current = null;
    }

    if (state.status === "success") {
      toast.success({ message: state.message });
      return;
    }

    if (state.status === "error") {
      toast.error({ message: state.message });
      return;
    }

    if (state.status === "warning") {
      toast.warning({ message: state.message });
    }
  }, [enabled, state.message, state.status, toast]);
}
