export type AllowedUrlToast = {
  variant: "success" | "error";
  message: string;
};

export function getAllowedUrlToast(
  error: string | null,
  message: string | null
): AllowedUrlToast | null {
  if (error) return null;

  if (message === "Signed out") {
    return { variant: "success", message: "Signed out" };
  }

  if (message === "Accounts are invitation-only") {
    return { variant: "success", message: "Accounts are invitation-only" };
  }

  return null;
}
