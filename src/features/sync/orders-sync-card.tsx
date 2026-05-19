"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { syncOrdersFromWooCommerceAction } from "@/features/sync/actions";
import { initialSyncOrdersState } from "@/features/sync/sync-action-state";

function SyncOrdersButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Syncing..." : "Sync orders from WooCommerce"}
    </button>
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
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">Order Sync</h2>
      <p className="mt-2 text-sm text-slate-600">
        Pull recent orders from WooCommerce into Supabase orders and order items.
      </p>

      <form
        action={wooConfigured ? formAction : undefined}
        className="mt-4"
        onSubmit={wooConfigured ? undefined : (event) => event.preventDefault()}
      >
        <SyncOrdersButton disabled={!wooConfigured} />
      </form>

      {state.status === "success" && state.message ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
