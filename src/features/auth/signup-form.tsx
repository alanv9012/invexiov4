"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/auth-form-state";
import { initialAuthFormState } from "@/features/auth/auth-form-state";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";

function SignupFormFields({ state }: { state: AuthFormState }) {
  const { pending } = useFormStatus();

  useActionToast(state, {
    pending,
    loadingMessage: "Creating account…"
  });

  return (
    <>
      <FormField label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" type="text" required minLength={2} autoComplete="name" />
      </FormField>

      <FormField label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </FormField>

      <FormField label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </FormField>

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialAuthFormState);

  return (
    <>
      <form action={formAction} className="space-y-4">
        <SignupFormFields state={state} />
      </form>

      <p className="mt-4 text-body-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
