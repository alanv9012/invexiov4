"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/auth-form-state";
import { initialAuthFormState } from "@/features/auth/auth-form-state";
import { useActionToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

function LogoutFormFields({ state }: { state: AuthFormState }) {
  const { pending } = useFormStatus();

  useActionToast(state, {
    pending,
    loadingMessage: "Signing out…"
  });

  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}

export function LogoutButton() {
  const [state, formAction] = useActionState(logoutAction, initialAuthFormState);

  return (
    <form action={formAction}>
      <LogoutFormFields state={state} />
    </form>
  );
}
