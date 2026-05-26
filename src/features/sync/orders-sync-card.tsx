"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { syncOrdersFromWooCommerceAction } from "@/features/sync/actions";
import { initialSyncOrdersState } from "@/features/sync/sync-action-state";
import type { SyncOrdersState } from "@/features/sync/sync-action-state";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

function OrderSyncForm({ state, disabled }: { state: SyncOrdersState; disabled: boolean }) {
  const { pending } = useFormStatus();

  useActionToast(state, {
    pending,
    loadingMessage: "Syncing orders from WooCommerce…"
  });

  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Syncing…" : "Sync orders from WooCommerce"}
    </Button>
  );
}

type OrdersSyncCardProps = {
  wooConfigured: boolean;
};

export function OrdersSyncCard({ wooConfigured }: OrdersSyncCardProps) {
  const [state, formAction] = useActionState(
    syncOrdersFromWooCommerceAction,
    initialSyncOrdersState
  );

  return (
    <Card padding="lg">
      <SectionHeader
        title="Order Sync"
        description="Pull recent orders from WooCommerce into Supabase orders and order items."
        className="mb-4"
      />

      <form
        action={wooConfigured ? formAction : undefined}
        onSubmit={wooConfigured ? undefined : (event) => event.preventDefault()}
      >
        <OrderSyncForm state={state} disabled={!wooConfigured} />
      </form>
    </Card>
  );
}
