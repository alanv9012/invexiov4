"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/auth-form-state";
import { initialAuthFormState } from "@/features/auth/auth-form-state";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";

function LoginFormFields({ state }: { state: AuthFormState }) {
  const { pending } = useFormStatus();

  useActionToast(state, {
    pending,
    loadingMessage: "Signing in…"
  });

  return (
    <>
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
          autoComplete="current-password"
        />
      </FormField>

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialAuthFormState);

  return (
    <>
      <form action={formAction} className="space-y-4">
        <LoginFormFields state={state} />
      </form>

      <p className="mt-4 text-body-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
