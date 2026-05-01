"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const adjustStockSchema = z.object({
  productId: z.string().uuid("Invalid product selected."),
  adjustmentAmount: z.coerce
    .number()
    .int("Adjustment amount must be a whole number.")
    .refine((value) => value !== 0, "Adjustment amount cannot be zero."),
  reason: z.string().trim().min(2, "Reason is required."),
  notes: z.string().trim().max(300, "Notes must be 300 characters or less.").optional()
});

export type AdjustStockFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialAdjustStockState: AdjustStockFormState = {
  status: "idle",
  message: null
};

function buildReason(reason: string, notes?: string): string {
  if (!notes) return reason;
  return `${reason} | Notes: ${notes}`;
}

export async function adjustStockAction(
  _previous: AdjustStockFormState,
  formData: FormData
): Promise<AdjustStockFormState> {
  const parsed = adjustStockSchema.safeParse({
    productId: formData.get("productId"),
    adjustmentAmount: formData.get("adjustmentAmount"),
    reason: formData.get("reason"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid form input."
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.rpc("record_inventory_movement", {
    p_product_id: parsed.data.productId,
    p_change_quantity: parsed.data.adjustmentAmount,
    p_reason: buildReason(parsed.data.reason, parsed.data.notes),
    p_source: "manual",
    p_user_id: user?.id ?? null,
    p_reference_type: "manual_adjustment",
    p_reference_id: null
  });

  if (error) {
    return {
      status: "error",
      message: "Could not save inventory adjustment. Please try again."
    };
  }

  revalidatePath("/products");

  return {
    status: "success",
    message: "Inventory updated successfully."
  };
}
