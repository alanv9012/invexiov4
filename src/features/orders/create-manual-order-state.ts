export type CreateManualOrderState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialCreateManualOrderState: CreateManualOrderState = {
  status: "idle",
  message: null
};
