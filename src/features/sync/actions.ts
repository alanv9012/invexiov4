"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/server/supabase/admin";
import { createWooCommerceClient } from "@/server/woocommerce/client";

export type SyncProductsState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialSyncProductsState: SyncProductsState = {
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
