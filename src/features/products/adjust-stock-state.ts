export type AdjustStockFormState = {
  status: "idle" | "success" | "warning" | "error";
  message: string | null;
};

export const initialAdjustStockState: AdjustStockFormState = {
  status: "idle",
  message: null
};
