export function SyncWooNotConfiguredAlert() {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">WooCommerce not configured</p>
      <p className="mt-1 text-amber-800">
        Set <span className="font-mono text-xs">WOOCOMMERCE_STORE_URL</span>,{" "}
        <span className="font-mono text-xs">WOOCOMMERCE_CONSUMER_KEY</span>, and{" "}
        <span className="font-mono text-xs">WOOCOMMERCE_CONSUMER_SECRET</span> in your server
        environment before syncing.
      </p>
    </div>
  );
}
