"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { adjustStockAction } from "@/features/products/actions";
import type { AdjustStockFormState } from "@/features/products/adjust-stock-state";
import { initialAdjustStockState } from "@/features/products/adjust-stock-state";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { StockLevelBadge } from "@/components/ui/inventory-badges";

export type StockAdjustmentProduct = {
  id: string;
  name: string;
  stockQuantity: number;
};

type StockAdjustmentDialogProps = {
  open: boolean;
  onClose: () => void;
  product: StockAdjustmentProduct | null;
};

function AdjustmentFormFooter({
  state,
  onCancel
}: {
  state: AdjustStockFormState;
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();

  useActionToast(state, {
    pending,
    loadingMessage: "Saving adjustment…"
  });

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
        Cancel
      </Button>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : "Save adjustment"}
      </Button>
    </div>
  );
}

export function StockAdjustmentDialog({ open, onClose, product }: StockAdjustmentDialogProps) {
  const [state, formAction] = useActionState(adjustStockAction, initialAdjustStockState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success" || state.status === "warning") {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state.status]);

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="drawer"
      title="Adjust inventory"
      description={product.name}
      submitOnEnter
    >
      <div className="mb-4 flex items-center gap-2 text-caption text-muted-foreground">
        <span>Current stock: {product.stockQuantity}</span>
        <StockLevelBadge quantity={product.stockQuantity} />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="productId" value={product.id} />

        <FormField label="Adjustment amount" htmlFor="palette-adjustment">
          <Input
            id="palette-adjustment"
            name="adjustmentAmount"
            type="number"
            required
            autoFocus
            placeholder="Negative to decrease, positive to increase"
          />
        </FormField>

        <FormField label="Reason" htmlFor="palette-reason">
          <Input
            id="palette-reason"
            name="reason"
            type="text"
            required
            placeholder="Damaged items, manual count correction, etc."
          />
        </FormField>

        <FormField label="Notes (optional)" htmlFor="palette-notes">
          <Textarea
            id="palette-notes"
            name="notes"
            rows={3}
            placeholder="Add any extra context for this adjustment."
          />
        </FormField>

        <AdjustmentFormFooter state={state} onCancel={onClose} />
      </form>
    </Dialog>
  );
}
