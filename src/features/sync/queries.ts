import "server-only";

import { getWooEnvStatus } from "@/server/woocommerce/env";

export type SyncPageData = {
  wooConfigured: boolean;
};

export function getSyncPageData(): SyncPageData {
  return {
    wooConfigured: getWooEnvStatus().allConfigured
  };
}
