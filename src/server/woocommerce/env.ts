import "server-only";

export type WooEnvStatus = {
  storeUrlConfigured: boolean;
  consumerKeyConfigured: boolean;
  consumerSecretConfigured: boolean;
  allConfigured: boolean;
  storeUrlDisplay: string | null;
};

export function getWooEnvStatus(): WooEnvStatus {
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL?.trim();
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET?.trim();

  return {
    storeUrlConfigured: Boolean(storeUrl),
    consumerKeyConfigured: Boolean(consumerKey),
    consumerSecretConfigured: Boolean(consumerSecret),
    allConfigured: Boolean(storeUrl && consumerKey && consumerSecret),
    storeUrlDisplay: storeUrl ? storeUrl.replace(/\/$/, "") : null
  };
}
