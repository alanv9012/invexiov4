"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { syncProductsFromWooCommerceAction } from "@/features/sync/actions";
import { initialSyncProductsState } from "@/features/sync/sync-action-state";
import type { SyncProductsState } from "@/features/sync/sync-action-state";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

function ProductSyncForm({ state, disabled }: { state: SyncProductsState; disabled: boolean }) {
  const { pending } = useFormStatus();

  useActionToast(state, {
    pending,
    loadingMessage: "Syncing products from WooCommerce…"
  });

  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Syncing…" : "Sync products from WooCommerce"}
    </Button>
  );
}

type ProductsSyncCardProps = {
  wooConfigured: boolean;
};

export function ProductsSyncCard({ wooConfigured }: ProductsSyncCardProps) {
  const [state, formAction] = useActionState(
    syncProductsFromWooCommerceAction,
    initialSyncProductsState
  );

  return (
    <Card padding="lg">
      <SectionHeader
        title="Product Sync"
        description="Pull products from WooCommerce and upsert them into Supabase."
        className="mb-4"
      />

      <form
        action={wooConfigured ? formAction : undefined}
        onSubmit={wooConfigured ? undefined : (event) => event.preventDefault()}
      >
        <ProductSyncForm state={state} disabled={!wooConfigured} />
      </form>
    </Card>
  );
}
