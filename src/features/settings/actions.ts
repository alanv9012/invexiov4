"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWooEnvStatus } from "@/features/settings/env";
import type { UpdateProfileState, WooTestConnectionState } from "@/features/settings/types";
import { createWooCommerceClient } from "@/server/woocommerce/client";

export const initialWooTestState: WooTestConnectionState = {
  status: "idle",
  message: null
};

export const initialUpdateProfileState: UpdateProfileState = {
  status: "idle",
  message: null
};

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.")
});

export async function testWooConnectionAction(
  _previous: WooTestConnectionState,
  _formData: FormData
): Promise<WooTestConnectionState> {
  const env = getWooEnvStatus();

  if (!env.allConfigured) {
    return {
      status: "error",
      message: "WooCommerce environment variables are not fully configured."
    };
  }

  try {
    const woo = createWooCommerceClient();
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

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in to update your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: parsed.data.fullName });

  if (error) {
    return { status: "error", message: "Could not update profile. Please try again." };
  }

  revalidatePath("/settings");

  return {
    status: "success",
    message: "Profile updated successfully."
  };
}
