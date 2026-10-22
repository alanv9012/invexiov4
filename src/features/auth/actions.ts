"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthFormState } from "@/features/auth/auth-form-state";
import {
  ACCESS_UNAVAILABLE_MESSAGE,
  INACTIVE_ACCESS_MESSAGE
} from "@/features/auth/login-access-message";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

const GENERIC_LOGIN_ERROR = "Invalid email or password.";
const GENERIC_SIGNOUT_ERROR = "Could not sign out. Please try again.";
const INVITATION_ONLY_ERROR = "Account creation is invitation-only. Contact the owner for access.";

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parse = loginSchema.safeParse({
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

  let hasActiveProfile = false;
  let profileCheckFailed = false;

  try {
    const { data, error: profileError } = await supabase.rpc("is_active_user");
    hasActiveProfile = !profileError && data === true;
    profileCheckFailed = Boolean(profileError);
  } catch {
    profileCheckFailed = true;
  }

  if (!hasActiveProfile) {
    let signOutFailed = false;
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      signOutFailed = Boolean(signOutError);
    } catch {
      signOutFailed = true;
    }
    const message = profileCheckFailed ? ACCESS_UNAVAILABLE_MESSAGE : INACTIVE_ACCESS_MESSAGE;

    if (signOutFailed) {
      return {
        status: "error",
        message: `${message} Sign-out could not be confirmed; close this browser before trying again.`
      };
    }

    return { status: "error", message };
  }

  redirect("/");
}

export async function signupAction(
  _previous: AuthFormState,
  _formData: FormData
): Promise<AuthFormState> {
  void _previous;
  void _formData;
  return { status: "error", message: INVITATION_ONLY_ERROR };
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
