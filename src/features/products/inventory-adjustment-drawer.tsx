"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { adjustStockAction } from "@/features/products/actions";
import { initialAdjustStockState } from "@/features/products/adjust-stock-state";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { StockLevelBadge } from "@/components/ui/inventory-badges";

type InventoryAdjustmentDrawerProps = {
  productId: string;
  productName: string;
  currentStock: number;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save adjustment"}
    </Button>
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
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Adjust stock
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        variant="drawer"
        title="Adjust inventory"
        description={productName}
      >
        <div className="mb-4 flex items-center gap-2 text-caption text-muted-foreground">
          <span>Current stock: {currentStock}</span>
          <StockLevelBadge quantity={currentStock} />
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />

          <FormField label="Adjustment amount" htmlFor={`adjustment-${productId}`}>
            <Input
              id={`adjustment-${productId}`}
              name="adjustmentAmount"
              type="number"
              required
              placeholder="Use negative for decrease, positive for increase"
            />
          </FormField>

          <FormField label="Reason" htmlFor={`reason-${productId}`}>
            <Input
              id={`reason-${productId}`}
              name="reason"
              type="text"
              required
              placeholder="Damaged items, manual count correction, etc."
            />
          </FormField>

          <FormField label="Notes (optional)" htmlFor={`notes-${productId}`}>
            <Textarea
              id={`notes-${productId}`}
              name="notes"
              rows={3}
              placeholder="Add any extra context for this adjustment."
            />
          </FormField>

          <ActionFeedback status={state.status} message={state.message} />

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
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
