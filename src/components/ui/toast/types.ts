export type ToastVariant = "success" | "error" | "warning" | "loading";

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  message: string;
  durationMs: number | null;
};

export type ToastInput = {
  message: string;
  durationMs?: number;
};
