"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { adjustStockAction } from "@/features/products/actions";
import {
  initialAdjustStockState,
  type AdjustStockFormState
} from "@/features/products/adjust-stock-state";

type InventoryAdjustmentDrawerProps = {
  productId: string;
  productName: string;
  currentStock: number;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save adjustment"}
    </button>
  );
}

function Feedback({ state }: { state: AdjustStockFormState }) {
  if (state.status === "idle" || !state.message) return null;

  if (state.status === "success") {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.message}
      </p>
    );
  }

  if (state.status === "warning") {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
        {state.message}
      </p>
    );
  }

  return (
    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {state.message}
    </p>
  );
}

export function InventoryAdjustmentDrawer({
  productId,
  productName,
  currentStock
}: InventoryAdjustmentDrawerProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(adjustStockAction, initialAdjustStockState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success" || state.status === "warning") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Adjust stock
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/30 p-4">
          <div className="ml-auto h-full w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Adjust inventory</h3>
                <p className="mt-1 text-sm text-slate-600">{productName}</p>
                <p className="text-xs text-slate-500">Current stock: {currentStock}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="productId" value={productId} />

              <div>
                <label htmlFor={`adjustment-${productId}`} className="mb-1 block text-sm font-medium text-slate-700">
                  Adjustment amount
                </label>
                <input
                  id={`adjustment-${productId}`}
                  name="adjustmentAmount"
                  type="number"
                  required
                  placeholder="Use negative for decrease, positive for increase"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label htmlFor={`reason-${productId}`} className="mb-1 block text-sm font-medium text-slate-700">
                  Reason
                </label>
                <input
                  id={`reason-${productId}`}
                  name="reason"
                  type="text"
                  required
                  placeholder="Damaged items, manual count correction, etc."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label htmlFor={`notes-${productId}`} className="mb-1 block text-sm font-medium text-slate-700">
                  Notes (optional)
                </label>
                <textarea
                  id={`notes-${productId}`}
                  name="notes"
                  rows={3}
                  placeholder="Add any extra context for this adjustment."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <Feedback state={state} />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
