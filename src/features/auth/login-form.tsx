"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/auth-form-state";
import { initialAuthFormState } from "@/features/auth/auth-form-state";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
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

export function LoginForm({ accessMessage }: { accessMessage?: string | null }) {
  const [state, formAction] = useActionState(loginAction, initialAuthFormState);

  return (
    <>
      {accessMessage ? (
        <Alert variant="danger" title="Access unavailable" className="mb-4">
          {accessMessage}
        </Alert>
      ) : null}

      <form action={formAction} className="space-y-4">
        <LoginFormFields state={state} />
      </form>

      <p className="mt-4 text-body-sm text-muted-foreground">
        Accounts are invitation-only. Contact the owner if you need access.
      </p>
    </>
  );
}
