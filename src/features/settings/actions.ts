"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getWooEnvStatus } from "@/server/woocommerce/env";
import type { UpdateProfileState, WooTestConnectionState } from "@/features/settings/types";
import { createWooCommerceClient } from "@/server/woocommerce/client";
import {
  authorizePermission,
  authorizePrivilegedPermission
} from "@/server/auth/authorization";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.")
});

export async function testWooConnectionAction(
  _previous: WooTestConnectionState,
  _formData: FormData
): Promise<WooTestConnectionState> {
  void _previous;
  void _formData;
  const authorization = await authorizePrivilegedPermission("integrations.manage");

  if (!authorization.authorized) {
    return {
      status: "error",
      message: "You do not have permission to test the WooCommerce connection."
    };
  }

  const env = getWooEnvStatus();

  if (!env.allConfigured) {
    return {
      status: "error",
      message: "WooCommerce environment variables are not fully configured."
    };
  }

  try {
    const woo = createWooCommerceClient(authorization);
    await woo.getProducts({ perPage: 1 });

    return {
      status: "success",
      message: "WooCommerce connection successful."
    };
  } catch {
    return {
      status: "error",
      message: "WooCommerce connection failed. Check store URL and API credentials."
    };
  }
}

export async function updateProfileAction(
  _previous: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid profile input."
    };
  }

  const authorization = await authorizePermission("profile.update_self");

  if (!authorization.authorized) {
    return { status: "error", message: "You do not have permission to update this profile." };
  }

  const { supabase, user } = authorization;
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    return { status: "error", message: "Could not update profile. Please try again." };
  }

  revalidatePath("/settings");

  return {
    status: "success",
    message: "Profile updated successfully."
  };
}
