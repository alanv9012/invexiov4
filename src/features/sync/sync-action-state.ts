export type SyncProductsState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialSyncProductsState: SyncProductsState = {
  status: "idle",
  message: null
};

export type SyncOrdersState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialSyncOrdersState: SyncOrdersState = {
  status: "idle",
  message: null
};
