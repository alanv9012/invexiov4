"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/server/supabase/admin";
import { createWooCommerceClient, type WooOrder } from "@/server/woocommerce/client";

export type SyncProductsState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialSyncProductsState: SyncProductsState = {
  status: "idle",
  message: null
};

export type SyncOrdersState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialSyncOrdersState: SyncOrdersState = {
  status: "idle",
  message: null
};

type WooProductRecord = {
  id: number;
  sku: string;
  name: string;
  price: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  status: string;
  images?: Array<{ src?: string }>;
};

type ExistingProduct = {
  id: string;
  sku: string;
  woo_product_id: number | null;
  stock_quantity: number;
};

function normalizeStatus(status: string): "active" | "draft" | "archived" {
  if (status === "publish" || status === "active" || status === "private") return "active";
  if (status === "draft" || status === "pending") return "draft";
  return "archived";
}

export async function syncProductsFromWooCommerceAction(
  _previous: SyncProductsState,
  _formData: FormData
): Promise<SyncProductsState> {
  const supabase = getSupabaseAdminClient();
  const syncStart = new Date().toISOString();
  const { data: logRow } = await supabase
    .from("sync_logs")
    .insert({
      type: "products",
      status: "running",
      message: "Started WooCommerce product sync.",
      payload: {},
      started_at: syncStart,
      finished_at: null
    })
    .select("id")
    .single();

  const syncLogId = logRow?.id ?? null;

  try {
    const woo = createWooCommerceClient();
    const fetchedProducts: WooProductRecord[] = [];
    const perPage = 100;

    for (let page = 1; page <= 20; page += 1) {
      const batch = (await woo.getProducts({ page, perPage })) as WooProductRecord[];
      fetchedProducts.push(...batch);

      if (batch.length < perPage) {
        break;
      }
    }

    const validProducts = fetchedProducts.filter((product) => Boolean(product.sku?.trim()));

    const wooIds = validProducts.map((product) => product.id);
    const skus = validProducts.map((product) => product.sku);

    const existingMap = new Map<string, ExistingProduct>();

    if (wooIds.length > 0) {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, woo_product_id, stock_quantity")
        .in("woo_product_id", wooIds);

      if (error) {
        throw new Error("Failed to load existing products by WooCommerce ID.");
      }

      for (const row of (data ?? []) as ExistingProduct[]) {
        existingMap.set(row.id, row);
      }
    }

    if (skus.length > 0) {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, woo_product_id, stock_quantity")
        .in("sku", skus);

      if (error) {
        throw new Error("Failed to load existing products by SKU.");
      }

      for (const row of (data ?? []) as ExistingProduct[]) {
        existingMap.set(row.id, row);
      }
    }

    const existingProducts = Array.from(existingMap.values());

    const existingByWooId = new Map<number, ExistingProduct>();
    const existingBySku = new Map<string, ExistingProduct>();

    for (const product of (existingProducts ?? []) as ExistingProduct[]) {
      if (product.woo_product_id) {
        existingByWooId.set(product.woo_product_id, product);
      }
      existingBySku.set(product.sku, product);
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let adjustedStockCount = 0;
    let skippedCount = fetchedProducts.length - validProducts.length;

    for (const wooProduct of validProducts) {
      const existing = existingByWooId.get(wooProduct.id) ?? existingBySku.get(wooProduct.sku);
      const safeStock = Math.max(wooProduct.stock_quantity ?? 0, 0);
      const now = new Date().toISOString();

      if (!existing) {
        const { error: insertError } = await supabase.from("products").insert({
          woo_product_id: wooProduct.id,
          sku: wooProduct.sku,
          name: wooProduct.name,
          price: Number(wooProduct.price || 0),
          stock_quantity: safeStock,
          manage_stock: wooProduct.manage_stock ?? true,
          status: normalizeStatus(wooProduct.status),
          image_url: wooProduct.images?.[0]?.src ?? null,
          last_synced_at: now
        });

        if (insertError) {
          skippedCount += 1;
          continue;
        }

        insertedCount += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          woo_product_id: wooProduct.id,
          sku: wooProduct.sku,
          name: wooProduct.name,
          price: Number(wooProduct.price || 0),
          manage_stock: wooProduct.manage_stock ?? true,
          status: normalizeStatus(wooProduct.status),
          image_url: wooProduct.images?.[0]?.src ?? null,
          last_synced_at: now
        })
        .eq("id", existing.id);

      if (updateError) {
        skippedCount += 1;
        continue;
      }

      updatedCount += 1;

      const changeQuantity = safeStock - existing.stock_quantity;
      if (changeQuantity !== 0) {
        const { error: movementError } = await supabase.rpc("record_inventory_movement", {
          p_product_id: existing.id,
          p_change_quantity: changeQuantity,
          p_reason: "WooCommerce stock sync",
          p_source: "sync",
          p_user_id: null,
          p_reference_type: "woo_product_sync",
          p_reference_id: null
        });

        if (!movementError) {
          adjustedStockCount += 1;
        }
      }
    }

    const successMessage = `Synced ${insertedCount + updatedCount} products (${insertedCount} new, ${updatedCount} updated, ${adjustedStockCount} stock adjustments, ${skippedCount} skipped).`;

    if (syncLogId) {
      await supabase
        .from("sync_logs")
        .update({
          status: "success",
          message: successMessage,
          payload: {
            fetched: fetchedProducts.length,
            processed: insertedCount + updatedCount,
            inserted: insertedCount,
            updated: updatedCount,
            stockAdjusted: adjustedStockCount,
            skipped: skippedCount
          },
          finished_at: new Date().toISOString()
        })
        .eq("id", syncLogId);
    }

    revalidatePath("/products");
    revalidatePath("/sync");

    return {
      status: "success",
      message: successMessage
    };
  } catch {
    const errorMessage = "Product sync failed. Please check WooCommerce credentials and try again.";

    if (syncLogId) {
      await supabase
        .from("sync_logs")
        .update({
          status: "failed",
          message: errorMessage,
          payload: {},
          finished_at: new Date().toISOString()
        })
        .eq("id", syncLogId);
    } else {
      await supabase.from("sync_logs").insert({
        type: "products",
        status: "failed",
        message: errorMessage,
        payload: {},
        started_at: syncStart,
        finished_at: new Date().toISOString()
      });
    }

    return {
      status: "error",
      message: errorMessage
    };
  }
}

type ExistingOrder = {
  id: string;
  woo_order_id: number;
};

function buildCustomerName(billing?: WooOrder["billing"]): string | null {
  if (!billing) return null;
  const name = [billing.first_name, billing.last_name].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : null;
}

export async function syncOrdersFromWooCommerceAction(
  _previous: SyncOrdersState,
  _formData: FormData
): Promise<SyncOrdersState> {
  const supabase = getSupabaseAdminClient();
  const syncStart = new Date().toISOString();
  const { data: logRow } = await supabase
    .from("sync_logs")
    .insert({
      type: "orders",
      status: "running",
      message: "Started WooCommerce order sync.",
      payload: {},
      started_at: syncStart,
      finished_at: null
    })
    .select("id")
    .single();

  const syncLogId = logRow?.id ?? null;

  try {
    const woo = createWooCommerceClient();
    const fetchedOrders: WooOrder[] = [];
    const perPage = 50;

    for (let page = 1; page <= 10; page += 1) {
      const batch = await woo.getOrders({ page, perPage });
      fetchedOrders.push(...batch);

      if (batch.length < perPage) {
        break;
      }
    }

    const wooOrderIds = fetchedOrders.map((order) => order.id);
    const existingByWooId = new Map<number, ExistingOrder>();

    if (wooOrderIds.length > 0) {
      const { data, error } = await supabase
        .from("orders")
        .select("id, woo_order_id")
        .in("woo_order_id", wooOrderIds);

      if (error) {
        throw new Error("Failed to load existing orders.");
      }

      for (const row of (data ?? []) as ExistingOrder[]) {
        existingByWooId.set(row.woo_order_id, row);
      }
    }

    const wooProductIds = new Set<number>();
    for (const order of fetchedOrders) {
      for (const item of order.line_items ?? []) {
        if (item.product_id) {
          wooProductIds.add(item.product_id);
        }
      }
    }

    const productIdByWooId = new Map<number, string>();
    const wooProductIdList = Array.from(wooProductIds);

    if (wooProductIdList.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, woo_product_id")
        .in("woo_product_id", wooProductIdList);

      for (const product of products ?? []) {
        if (product.woo_product_id) {
          productIdByWooId.set(product.woo_product_id, product.id);
        }
      }
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let itemsSynced = 0;
    let skippedCount = 0;

    for (const wooOrder of fetchedOrders) {
      const now = new Date().toISOString();
      const existing = existingByWooId.get(wooOrder.id);
      const orderPayload = {
        woo_order_id: wooOrder.id,
        order_number: String(wooOrder.number),
        status: wooOrder.status,
        currency: wooOrder.currency?.slice(0, 3) || "USD",
        total_amount: Number(wooOrder.total || 0),
        customer_name: buildCustomerName(wooOrder.billing),
        customer_email: wooOrder.billing?.email ?? null,
        source: "woocommerce" as const,
        notes: wooOrder.customer_note ?? null,
        ordered_at: wooOrder.date_created,
        last_synced_at: now
      };

      let orderId: string | null = null;

      if (existing) {
        const { error: updateError } = await supabase
          .from("orders")
          .update(orderPayload)
          .eq("id", existing.id);

        if (updateError) {
          skippedCount += 1;
          continue;
        }

        orderId = existing.id;
        updatedCount += 1;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("orders")
          .insert(orderPayload)
          .select("id")
          .single();

        if (insertError || !inserted) {
          skippedCount += 1;
          continue;
        }

        orderId = inserted.id;
        insertedCount += 1;
      }

      await supabase.from("order_items").delete().eq("order_id", orderId);

      const lineItems = (wooOrder.line_items ?? [])
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          order_id: orderId,
          product_id: productIdByWooId.get(item.product_id) ?? null,
          woo_line_item_id: item.id,
          sku: item.sku || null,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price ?? 0),
          line_total: Number(item.total ?? 0)
        }));

      if (lineItems.length > 0) {
        const { error: itemsError } = await supabase.from("order_items").insert(lineItems);

        if (!itemsError) {
          itemsSynced += lineItems.length;
        }
      }
    }

    const successMessage = `Synced ${insertedCount + updatedCount} orders (${insertedCount} new, ${updatedCount} updated, ${itemsSynced} line items, ${skippedCount} skipped).`;

    if (syncLogId) {
      await supabase
        .from("sync_logs")
        .update({
          status: "success",
          message: successMessage,
          payload: {
            fetched: fetchedOrders.length,
            inserted: insertedCount,
            updated: updatedCount,
            itemsSynced,
            skipped: skippedCount
          },
          finished_at: new Date().toISOString()
        })
        .eq("id", syncLogId);
    }

    revalidatePath("/orders");
    revalidatePath("/sync");

    return {
      status: "success",
      message: successMessage
    };
  } catch {
    const errorMessage = "Order sync failed. Please check WooCommerce credentials and try again.";

    if (syncLogId) {
      await supabase
        .from("sync_logs")
        .update({
          status: "failed",
          message: errorMessage,
          payload: {},
          finished_at: new Date().toISOString()
        })
        .eq("id", syncLogId);
    } else {
      await supabase.from("sync_logs").insert({
        type: "orders",
        status: "failed",
        message: errorMessage,
        payload: {},
        started_at: syncStart,
        finished_at: new Date().toISOString()
      });
    }

    return {
      status: "error",
      message: errorMessage
    };
  }
}
