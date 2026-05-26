"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthFormState } from "@/features/auth/auth-form-state";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase/admin";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.").optional()
});

const GENERIC_LOGIN_ERROR = "Invalid email or password.";
const GENERIC_SIGNUP_ERROR = "Could not create your account. Please try again.";
const GENERIC_SIGNOUT_ERROR = "Could not sign out. Please try again.";

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parse = authSchema.omit({ fullName: true }).safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message ?? "Invalid input."
    };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parse.data);

  if (error) {
    return {
      status: "error",
      message: GENERIC_LOGIN_ERROR
    };
  }

  redirect("/");
}

export async function signupAction(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parse = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName")
  });

  if (!parse.success) {
    return {
      status: "error",
      message: parse.error.issues[0]?.message ?? "Invalid input."
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parse.data.email,
    password: parse.data.password
  });

  if (error) {
    return {
      status: "error",
      message: GENERIC_SIGNUP_ERROR
    };
  }

  if (data.user?.id) {
    const admin = getSupabaseAdminClient();
    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      full_name: parse.data.fullName
    });

    if (profileError) {
      return {
        status: "error",
        message: "Account created, but profile setup failed. Contact support if this persists."
      };
    }
  }

  redirect("/?message=Account%20created");
}

export async function logoutAction(): Promise<AuthFormState> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        status: "error",
        message: GENERIC_SIGNOUT_ERROR
      };
    }
  } catch {
    return {
      status: "error",
      message: GENERIC_SIGNOUT_ERROR
    };
  }

  redirect("/login?message=Signed%20out");
}
