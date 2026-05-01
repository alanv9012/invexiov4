"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/server/supabase/admin";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.").optional()
});

function toSearchMessage(message: string): string {
  return encodeURIComponent(message);
}

export async function loginAction(formData: FormData) {
  const parse = authSchema.omit({ fullName: true }).safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parse.success) {
    return redirect(`/login?error=${toSearchMessage(parse.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parse.data);

  if (error) {
    return redirect(`/login?error=${toSearchMessage(error.message)}`);
  }

  redirect("/");
}

export async function signupAction(formData: FormData) {
  const parse = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName")
  });

  if (!parse.success) {
    return redirect(`/signup?error=${toSearchMessage(parse.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parse.data.email,
    password: parse.data.password
  });

  if (error) {
    return redirect(`/signup?error=${toSearchMessage(error.message)}`);
  }

  if (data.user?.id) {
    const admin = getSupabaseAdminClient();
    await admin.from("profiles").upsert({
      id: data.user.id,
      full_name: parse.data.fullName
    });
  }

  redirect("/?message=Account%20created");
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
