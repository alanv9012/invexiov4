"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

export type CreateManualOrderState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialCreateManualOrderState: CreateManualOrderState = {
  status: "idle",
  message: null
};

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `MAN-${date}-${suffix}`;
}

export async function createManualOrderAction(
  _previous: CreateManualOrderState,
  formData: FormData
): Promise<CreateManualOrderState> {
  const parsed = createManualOrderSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    notes: formData.get("notes"),
    lineItemsJson: formData.get("lineItems")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid order input."
    };
  }

  let lineItems: z.infer<typeof lineItemSchema>[];
  try {
    const raw = JSON.parse(parsed.data.lineItemsJson) as unknown;
    const itemsParsed = z.array(lineItemSchema).min(1, "Add at least one product.").safeParse(raw);
    if (!itemsParsed.success) {
      return {
        status: "error",
        message: itemsParsed.error.issues[0]?.message ?? "Invalid line items."
      };
    }
    lineItems = itemsParsed.data;
  } catch {
    return { status: "error", message: "Invalid line items payload." };
  }

  const mergedItems = new Map<string, number>();
  for (const item of lineItems) {
    mergedItems.set(item.productId, (mergedItems.get(item.productId) ?? 0) + item.quantity);
  }
  lineItems = Array.from(mergedItems.entries()).map(([productId, quantity]) => ({
    productId,
    quantity
  }));

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const productIds = lineItems.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, sku, price, stock_quantity")
    .in("id", productIds);

  if (productsError || !products?.length) {
    return { status: "error", message: "Could not load selected products." };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalAmount = 0;
  for (const item of lineItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { status: "error", message: "One or more selected products are invalid." };
    }
    if (item.quantity > product.stock_quantity) {
      return {
        status: "error",
        message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}.`
      };
    }
    totalAmount += Number(product.price) * item.quantity;
  }

  const orderNumber = generateOrderNumber();

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
      created_by: user?.id ?? null,
      ordered_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { status: "error", message: "Could not create order. Please try again." };
  }

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
    await supabase.from("orders").delete().eq("id", order.id);
    return { status: "error", message: "Could not save order items. Please try again." };
  }

  const reversedMovements: Array<{ productId: string; quantity: number }> = [];

  for (const item of lineItems) {
    const product = productMap.get(item.productId)!;
    const { error: movementError } = await supabase.rpc("record_inventory_movement", {
      p_product_id: item.productId,
      p_change_quantity: -item.quantity,
      p_reason: `Manual order ${order.id}`,
      p_source: "manual",
      p_user_id: user?.id ?? null,
      p_reference_type: "manual_order",
      p_reference_id: order.id
    });

    if (movementError) {
      for (const reversed of reversedMovements) {
        await supabase.rpc("record_inventory_movement", {
          p_product_id: reversed.productId,
          p_change_quantity: reversed.quantity,
          p_reason: `Rollback failed manual order ${order.id}`,
          p_source: "system",
          p_user_id: user?.id ?? null,
          p_reference_type: "manual_order_rollback",
          p_reference_id: order.id
        });
      }

      await supabase.from("orders").delete().eq("id", order.id);

      return {
        status: "error",
        message: `Could not update stock for ${product.name}. Order was not created.`
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
}
