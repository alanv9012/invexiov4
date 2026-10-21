"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CreateManualOrderState } from "@/features/orders/create-manual-order-state";
import { authorizePermission } from "@/server/auth/authorization";

const lineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1.")
});

const createManualOrderSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is required."),
  customerEmail: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  lineItemsJson: z.string().min(2, "Add at least one product.")
});

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `MAN-${date}-${suffix}`;
}

type ManualOrderFailureStep =
  | "validation"
  | "authentication"
  | "products_load"
  | "order_insert"
  | "order_items_insert"
  | "inventory_movement";

type SupabaseErrorShape = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

// A transport/PostgREST failure does not prove the database transaction failed.
// Recognize only transaction-aborting errors; connection/completion-unknown
// SQLSTATEs (such as 08007/40003) must retain recovery information.
function isConfirmedDatabaseFailure(error: unknown): boolean {
  const code = (error as SupabaseErrorShape | null)?.code;
  return typeof code === "string" && [
    "42501", "P0001", "23502", "23503", "23505", "23514",
    "22003", "22P02", "40001", "40P01", "57014"
  ].includes(code);
}

function logManualOrderFailure(
  step: ManualOrderFailureStep,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const supabaseError = error as SupabaseErrorShape;

  console.error(`[createManualOrderAction] ${step} failed`, {
    message: supabaseError?.message ?? (error instanceof Error ? error.message : String(error)),
    code: supabaseError?.code,
    details: supabaseError?.details,
    hint: supabaseError?.hint,
    ...context
  });
}

function uiMessageForFailure(
  step: ManualOrderFailureStep,
  error: unknown,
  fallback: string
): string {
  const supabaseError = error as SupabaseErrorShape;

  if (supabaseError?.code === "42501") {
    return `${fallback} Database permission denied (RLS). Check authenticated policies.`;
  }

  if (supabaseError?.message) {
    return `${fallback} ${supabaseError.message}`;
  }

  return fallback;
}

export async function createManualOrderAction(
  _previous: CreateManualOrderState,
  formData: FormData
): Promise<CreateManualOrderState> {
  let recoveryReference: string | null = null;
  try {
    const parsed = createManualOrderSchema.safeParse({
      customerName: formData.get("customerName"),
      customerEmail: formData.get("customerEmail"),
      customerPhone: formData.get("customerPhone"),
      notes: formData.get("notes"),
      lineItemsJson: formData.get("lineItems")
    });

    if (!parsed.success) {
      const validationMessage = parsed.error.issues[0]?.message ?? "Invalid order input.";
      logManualOrderFailure("validation", parsed.error, { validationMessage });
      return {
        status: "error",
        message: `Validation error: ${validationMessage}`
      };
    }

    let lineItems: z.infer<typeof lineItemSchema>[];
    try {
      const raw = JSON.parse(parsed.data.lineItemsJson) as unknown;
      const itemsParsed = z.array(lineItemSchema).min(1, "Add at least one product.").safeParse(raw);
      if (!itemsParsed.success) {
        const validationMessage = itemsParsed.error.issues[0]?.message ?? "Invalid line items.";
        logManualOrderFailure("validation", itemsParsed.error, { validationMessage });
        return {
          status: "error",
          message: `Validation error: ${validationMessage}`
        };
      }
      lineItems = itemsParsed.data;
    } catch (error) {
      logManualOrderFailure("validation", error, { reason: "Invalid line items JSON payload" });
      return { status: "error", message: "Validation error: Invalid line items payload." };
    }

    const mergedItems = new Map<string, number>();
    for (const item of lineItems) {
      mergedItems.set(item.productId, (mergedItems.get(item.productId) ?? 0) + item.quantity);
    }
    lineItems = Array.from(mergedItems.entries()).map(([productId, quantity]) => ({
      productId,
      quantity
    }));

    const authorization = await authorizePermission("orders.create_manual");

    if (!authorization.authorized) {
      logManualOrderFailure("authentication", new Error(authorization.reason));
      return {
        status: "error",
        message: "You do not have permission to create manual orders."
      };
    }

    const { supabase, user } = authorization;
    const productIds = lineItems.map((item) => item.productId);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, sku, price, stock_quantity")
      .in("id", productIds);

    if (productsError) {
      logManualOrderFailure("products_load", productsError, { productIds });
      return {
        status: "error",
        message: uiMessageForFailure(
          "products_load",
          productsError,
          "Could not load selected products for this order."
        )
      };
    }

    if (!products?.length) {
      logManualOrderFailure("products_load", new Error("No products returned for selected IDs"), {
        productIds
      });
      return {
        status: "error",
        message: "Could not load selected products. Verify product IDs and database read policies."
      };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    for (const item of lineItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        logManualOrderFailure("validation", new Error("Selected product not found in query result"), {
          productId: item.productId
        });
        return {
          status: "error",
          message: "Validation error: One or more selected products are invalid."
        };
      }
      if (item.quantity > product.stock_quantity) {
        return {
          status: "error",
          message: `Validation error: Insufficient stock for ${product.name}. Available: ${product.stock_quantity}.`
        };
      }
      totalAmount += Number(product.price) * item.quantity;
    }

    const orderNumber = generateOrderNumber();
    recoveryReference = orderNumber;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "processing",
        currency: "USD",
        total_amount: totalAmount,
        customer_name: parsed.data.customerName,
        customer_email: parsed.data.customerEmail || null,
        customer_phone: parsed.data.customerPhone || null,
        source: "manual",
        notes: parsed.data.notes || null,
        created_by: user.id,
        ordered_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (orderError) {
      logManualOrderFailure("order_insert", orderError, { orderNumber, totalAmount });
      return {
        status: "error",
        message: isConfirmedDatabaseFailure(orderError)
          ? uiMessageForFailure("order_insert", orderError, "Order insert failed. The order was not created.")
          : `Order ${orderNumber} creation could not be confirmed. Do not retry the sale; ask the Owner to reconcile it.`
      };
    }

    if (!order) {
      logManualOrderFailure("order_insert", new Error("Insert succeeded but no order row returned"), {
        orderNumber
      });
      return {
        status: "error",
        message: `Order ${orderNumber} creation could not be confirmed. Do not retry the sale; ask the Owner to reconcile it.`
      };
    }

    recoveryReference = `${orderNumber} (${order.id})`;

    // RLS can silently delete zero rows. Require a returned row before reporting
    // cleanup success; the A2 trigger additionally refuses unbalanced stock.
    const deleteOrderForRecovery = async (): Promise<boolean> => {
      const { data: deleted, error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id)
        .select("id")
        .maybeSingle();
      if (deleteError || !deleted) {
        logManualOrderFailure("inventory_movement", deleteError ?? new Error("Order cleanup deleted no rows"), {
          orderId: order.id, phase: "cleanup"
        });
        return false;
      }
      return true;
    };
    const recoveryMessage = `Recovery required for order ${recoveryReference}. Stock or cleanup could not be confirmed. Do not retry the sale; ask the Owner to reconcile this order.`;

    const orderItemsPayload = lineItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      return {
        order_id: order.id,
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: unitPrice * item.quantity
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);

    if (itemsError) {
      logManualOrderFailure("order_items_insert", itemsError, {
        orderId: order.id,
        itemCount: orderItemsPayload.length
      });
      const cleanedUp = await deleteOrderForRecovery();
      return {
        status: "error",
        message: !cleanedUp ? recoveryMessage : uiMessageForFailure(
          "order_items_insert",
          itemsError,
          "Order items insert failed. The order was rolled back."
        )
      };
    }

    const reversedMovements: Array<{ productId: string; quantity: number }> = [];

    for (const item of lineItems) {
      const product = productMap.get(item.productId)!;
      const { error: movementError } = await supabase.rpc("record_inventory_movement", {
        p_product_id: item.productId,
        p_change_quantity: -item.quantity,
        p_reason: `Manual order ${order.id}`,
        p_source: "manual",
        p_user_id: user.id,
        p_reference_type: "manual_order",
        p_reference_id: order.id
      });

      if (movementError) {
        logManualOrderFailure("inventory_movement", movementError, {
          orderId: order.id,
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity
        });

        let compensationFailed = false;
        for (const reversed of reversedMovements) {
          const { error: rollbackError } = await supabase.rpc("record_inventory_movement", {
            p_product_id: reversed.productId,
            p_change_quantity: reversed.quantity,
            p_reason: `Rollback failed manual order ${order.id}`,
            p_source: "system",
            p_user_id: user.id,
            p_reference_type: "manual_order_rollback",
            p_reference_id: order.id
          });

          if (rollbackError) {
            compensationFailed = true;
            logManualOrderFailure("inventory_movement", rollbackError, {
              orderId: order.id,
              productId: reversed.productId,
              phase: "rollback"
            });
          }
        }

        // A failed RPC response may hide a committed deduction. The locked
        // database cleanup guard is authoritative, including for that item.
        // Preserve the order if any compensation result is uncertain.
        const cleanedUp = !compensationFailed
          && isConfirmedDatabaseFailure(movementError)
          && await deleteOrderForRecovery();

        return {
          status: "error",
          message: !cleanedUp ? recoveryMessage : uiMessageForFailure(
            "inventory_movement",
            movementError,
            `Inventory movement failed for ${product.name}. The order was rolled back.`
          )
        };
      }

      reversedMovements.push({ productId: item.productId, quantity: item.quantity });
    }

    revalidatePath("/orders");
    revalidatePath("/products");

    const formattedTotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(totalAmount);

    return {
      status: "success",
      message: `Order ${orderNumber} created. Total: ${formattedTotal}.`
    };
  } catch (error) {
    logManualOrderFailure("order_insert", error, { phase: "unexpected" });
    return {
      status: "error",
      message: recoveryReference
        ? `Order ${recoveryReference} may be partially saved. Do not retry the sale; ask the Owner to reconcile it. Check server logs for recovery details.`
        : "An unexpected error occurred before submitting the order. Check server logs for details."
    };
  }
}
