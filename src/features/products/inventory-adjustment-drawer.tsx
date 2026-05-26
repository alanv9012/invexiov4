"use client";

import { useState } from "react";
import { StockAdjustmentDialog } from "@/features/products/stock-adjustment-dialog";
import { Button } from "@/components/ui/button";

type InventoryAdjustmentDrawerProps = {
  productId: string;
  productName: string;
  currentStock: number;
};

export function InventoryAdjustmentDrawer({
  productId,
  productName,
  currentStock
}: InventoryAdjustmentDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        Adjust stock
      </Button>

      <StockAdjustmentDialog
        open={open}
        onClose={() => setOpen(false)}
        product={{ id: productId, name: productName, stockQuantity: currentStock }}
      />
    </>
  );
}
