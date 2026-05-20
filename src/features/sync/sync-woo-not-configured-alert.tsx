import { Alert } from "@/components/ui/alert";

export function SyncWooNotConfiguredAlert() {
  return (
    <Alert variant="warning" title="WooCommerce not configured">
      Set <span className="font-mono text-xs">WOOCOMMERCE_STORE_URL</span>,{" "}
      <span className="font-mono text-xs">WOOCOMMERCE_CONSUMER_KEY</span>, and{" "}
      <span className="font-mono text-xs">WOOCOMMERCE_CONSUMER_SECRET</span> in your server environment
      before syncing.
    </Alert>
  );
}
