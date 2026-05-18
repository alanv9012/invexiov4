import type { WooEnvStatus } from "@/server/woocommerce/env";

export type SettingsProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
};

export type SettingsWooConnection = {
  id: string;
  name: string;
  storeUrl: string;
  isActive: boolean;
  lastSuccessfulSyncAt: string | null;
  lastErrorMessage: string | null;
} | null;

export type SettingsPageData = {
  wooEnv: WooEnvStatus;
  profile: SettingsProfile | null;
  wooConnection: SettingsWooConnection;
  errorMessage: string | null;
};

export type WooTestConnectionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message: string | null;
};
