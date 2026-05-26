"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createManualOrderAction } from "@/features/orders/actions";
import { initialCreateManualOrderState } from "@/features/orders/create-manual-order-state";
import type { OrderFormProduct } from "@/features/orders/queries";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/ui/cn";

type LineRow = {
  key: string;
  productId: string;
  quantity: number;
};

type CreateOrderFormProps = {
  products: OrderFormProduct[];
  className?: string;
};

function newLineRow(): LineRow {
  return { key: crypto.randomUUID(), productId: "", quantity: 1 };
}

export function CreateOrderForm({ products, className }: CreateOrderFormProps) {
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
      <Card variant="dashed" padding="md" className="text-body-sm text-muted-foreground">
        Add products before creating manual orders.
      </Card>
    );
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className={cn("w-full sm:w-auto", className)}>
        Create manual order
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        variant="drawer"
        title="New manual order"
        description="Stock is reduced through inventory movements when the order is saved."
        submitOnEnter
      >
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="lineItems" value={lineItemsJson} />

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-0.5">
            <FormField label="Customer name" htmlFor="customerName">
              <Input id="customerName" name="customerName" required autoComplete="name" />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Email (optional)" htmlFor="customerEmail">
                <Input id="customerEmail" name="customerEmail" type="email" autoComplete="email" />
              </FormField>
              <FormField label="Phone (optional)" htmlFor="customerPhone">
                <Input id="customerPhone" name="customerPhone" type="tel" autoComplete="tel" />
              </FormField>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-foreground">Products</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setLines((current) => [...current, newLineRow()])}
                >
                  Add product
                </Button>
              </div>

              {lines.map((line, index) => (
                <div
                  key={line.key}
                  className="space-y-2 rounded-md border border-border p-3 sm:grid sm:grid-cols-[1fr_6rem_auto] sm:items-end sm:gap-2"
                >
                  <Select
                    value={line.productId}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((row) =>
                          row.key === line.key ? { ...row, productId: event.target.value } : row
                        )
                      )
                    }
                    required={index === 0}
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) — {product.stockQuantity} in stock
                      </option>
                    ))}
                  </Select>

                  <FormField label="Qty" htmlFor={`qty-${line.key}`} className="sm:space-y-1">
                    <Input
                      id={`qty-${line.key}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
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
                    />
                  </FormField>

                  {lines.length > 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setLines((current) => current.filter((row) => row.key !== line.key))}
                    >
                      Remove
                    </Button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-body-sm font-medium text-foreground">Order total: {formattedTotal}</p>

            <FormField label="Notes (optional)" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} />
            </FormField>
          </div>

          <CreateOrderFormFooter state={state} onCancel={() => setOpen(false)} />
        </form>
      </Dialog>
    </>
  );
}

function CreateOrderFormFooter({
  state,
  onCancel
}: {
  state: { status: string; message: string | null };
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();

  useActionToast(state, {
    pending,
    loadingMessage: "Creating order…"
  });

  return (
    <div className="sticky bottom-0 -mx-4 mt-4 flex flex-col-reverse gap-2 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:flex-row sm:justify-end sm:px-0 sm:py-4">
      <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
        Cancel
      </Button>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Creating order…" : "Create order"}
      </Button>
    </div>
  );
}
