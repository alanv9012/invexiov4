export const INACTIVE_ACCESS_MESSAGE =
  "This account is inactive or does not have application access. Contact the owner.";

export const ACCESS_UNAVAILABLE_MESSAGE =
  "Application access could not be verified. Please try again later.";

export function getLoginAccessMessage(access: string | string[] | undefined): string | null {
  const code = Array.isArray(access) ? access[0] : access;

  if (code === "inactive") return INACTIVE_ACCESS_MESSAGE;
  if (code === "unavailable") return ACCESS_UNAVAILABLE_MESSAGE;
  return null;
}
