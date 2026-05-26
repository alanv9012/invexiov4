export type AuthFormState = {
  status: "idle" | "error";
  message: string | null;
};

export const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: null
};
