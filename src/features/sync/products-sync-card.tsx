"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialSyncProductsState,
  syncProductsFromWooCommerceAction
} from "@/features/sync/actions";

function SyncButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Syncing..." : "Sync products from WooCommerce"}
    </button>
  );
}

export function ProductsSyncCard() {
  const [state, formAction] = useActionState(
    syncProductsFromWooCommerceAction,
    initialSyncProductsState
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-900">Product Sync</h2>
      <p className="mt-2 text-sm text-slate-600">
        Pull products from WooCommerce and upsert them into Supabase.
      </p>

      <form action={formAction} className="mt-4">
        <SyncButton />
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
