"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createManualOrderAction } from "@/features/orders/actions";
import { initialCreateManualOrderState } from "@/features/orders/create-manual-order-state";
import type { OrderFormProduct } from "@/features/orders/queries";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input, Select, Textarea } from "@/components/ui/input";
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
    <Button type="submit" disabled={pending}>
      {pending ? "Creating order..." : "Create order"}
    </Button>
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
      <Card variant="dashed" padding="md" className="text-body-sm text-muted-foreground">
        Add products before creating manual orders.
      </Card>
    );
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Create manual order
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        variant="drawer"
        title="New manual order"
        description="Stock is reduced through inventory movements when the order is saved."
        className="max-w-lg"
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="lineItems" value={lineItemsJson} />

          <FormField label="Customer name" htmlFor="customerName">
            <Input id="customerName" name="customerName" required />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Email (optional)" htmlFor="customerEmail">
              <Input id="customerEmail" name="customerEmail" type="email" />
            </FormField>
            <FormField label="Phone (optional)" htmlFor="customerPhone">
              <Input id="customerPhone" name="customerPhone" type="tel" />
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Products</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLines((current) => [...current, newLineRow()])}
              >
                Add product
              </Button>
            </div>

            {lines.map((line, index) => (
              <div
                key={line.key}
                className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_100px_auto]"
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

                <Input
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
                />

                {lines.length > 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setLines((current) => current.filter((row) => row.key !== line.key))}
                  >
                    Remove
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>

          <p className="text-body-sm font-medium text-foreground">Order total: {formattedTotal}</p>

          <FormField label="Notes (optional)" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} />
          </FormField>

          <ActionFeedback
            status={state.status === "idle" ? "idle" : state.status}
            message={state.message}
          />

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </div>
        </form>
      </Dialog>
    </>
  );
}
