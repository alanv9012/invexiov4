"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createManualOrderAction,
  initialCreateManualOrderState,
  type CreateManualOrderState
} from "@/features/orders/actions";
import type { OrderFormProduct } from "@/features/orders/queries";

type LineRow = {
  key: string;
  productId: string;
  quantity: number;
};

type CreateOrderFormProps = {
  products: OrderFormProduct[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating order..." : "Create order"}
    </button>
  );
}

function Feedback({ state }: { state: CreateManualOrderState }) {
  if (state.status === "idle" || !state.message) return null;

  if (state.status === "success") {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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

function newLineRow(): LineRow {
  return { key: crypto.randomUUID(), productId: "", quantity: 1 };
}

export function CreateOrderForm({ products }: CreateOrderFormProps) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<LineRow[]>([newLineRow()]);
  const [state, formAction] = useActionState(createManualOrderAction, initialCreateManualOrderState);
  const router = useRouter();

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const lineItemsJson = useMemo(
    () =>
      JSON.stringify(
        lines
          .filter((line) => line.productId && line.quantity > 0)
          .map((line) => ({ productId: line.productId, quantity: line.quantity }))
      ),
    [lines]
  );

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const product = productById.get(line.productId);
      if (!product || line.quantity <= 0) return sum;
      return sum + product.price * line.quantity;
    }, 0);
  }, [lines, productById]);

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(total);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      setLines([newLineRow()]);
      router.refresh();
    }
  }, [router, state.status]);

  if (products.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        Add products before creating manual orders.
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Create manual order
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/30 p-4">
          <div className="ml-auto h-full w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">New manual order</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Stock is reduced through inventory movements when the order is saved.
                </p>
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
              <input type="hidden" name="lineItems" value={lineItemsJson} />

              <div>
                <label htmlFor="customerName" className="mb-1 block text-sm font-medium text-slate-700">
                  Customer name
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="customerEmail" className="mb-1 block text-sm font-medium text-slate-700">
                    Email (optional)
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="mb-1 block text-sm font-medium text-slate-700">
                    Phone (optional)
                  </label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Products</p>
                  <button
                    type="button"
                    onClick={() => setLines((current) => [...current, newLineRow()])}
                    className="text-sm font-medium text-slate-900 underline"
                  >
                    Add product
                  </button>
                </div>

                {lines.map((line, index) => (
                  <div
                    key={line.key}
                    className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_100px_auto]"
                  >
                    <select
                      value={line.productId}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((row) =>
                            row.key === line.key ? { ...row, productId: event.target.value } : row
                          )
                        )
                      }
                      required={index === 0}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku}) — {product.stockQuantity} in stock
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((row) =>
                            row.key === line.key
                              ? { ...row, quantity: Number(event.target.value) || 1 }
                              : row
                          )
                        )
                      }
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />

                    {lines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setLines((current) => current.filter((row) => row.key !== line.key))}
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Remove
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm font-medium text-slate-900">Order total: {formattedTotal}</p>

              <div>
                <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <Feedback state={state} />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
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
