"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase/admin";
import { createWooCommerceClient } from "@/server/woocommerce/client";

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
  status: "idle" | "success" | "warning" | "error";
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
  const admin = getSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: movement, error } = await supabase.rpc("record_inventory_movement", {
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

  const { data: product } = await admin
    .from("products")
    .select("woo_product_id")
    .eq("id", parsed.data.productId)
    .single();

  const movementResult = movement as { new_quantity: number } | null;
  const newQuantity = movementResult?.new_quantity ?? null;
  const wooProductId = product?.woo_product_id ?? null;

  if (!wooProductId || newQuantity === null) {
    await admin.from("sync_logs").insert({
      type: "inventory",
      status: "success",
      message: "Inventory adjusted locally. No WooCommerce product link found.",
      payload: {
        productId: parsed.data.productId,
        changeQuantity: parsed.data.adjustmentAmount
      },
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    });

    revalidatePath("/products");

    return {
      status: "success",
      message: "Inventory updated successfully."
    };
  }

  try {
    const woo = createWooCommerceClient();
    await woo.updateProductStock(wooProductId, newQuantity);

    await admin.from("sync_logs").insert({
      type: "inventory",
      status: "success",
      message: "Inventory updated locally and synced to WooCommerce.",
      payload: {
        productId: parsed.data.productId,
        wooProductId,
        newQuantity,
        changeQuantity: parsed.data.adjustmentAmount
      },
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    });

    revalidatePath("/products");

    return {
      status: "success",
      message: "Inventory updated and synced to WooCommerce."
    };
  } catch {
    await admin.from("sync_logs").insert({
      type: "inventory",
      status: "failed",
      message: "Inventory updated locally, but WooCommerce sync failed.",
      payload: {
        productId: parsed.data.productId,
        wooProductId,
        newQuantity,
        changeQuantity: parsed.data.adjustmentAmount
      },
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    });

    revalidatePath("/products");

    return {
      status: "warning",
      message: "Local stock was updated, but WooCommerce sync failed. Please retry from Sync."
    };
  }
}
