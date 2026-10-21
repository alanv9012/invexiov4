import "server-only";

import { authorizePrivilegedPermission } from "@/server/auth/authorization";
import { getWooEnvStatus } from "@/server/woocommerce/env";

export type SyncPageData = {
  authorized: boolean;
  wooConfigured: boolean;
};

export async function getSyncPageData(): Promise<SyncPageData> {
  const authorization = await authorizePrivilegedPermission("sync.run");

  if (!authorization.authorized) {
    return {
      authorized: false,
      wooConfigured: false
    };
  }

  return {
    authorized: true,
    wooConfigured: getWooEnvStatus().allConfigured
  };
}
