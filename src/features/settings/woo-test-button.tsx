"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialWooTestState, testWooConnectionAction } from "@/features/settings/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function TestButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Testing..." : "Test connection"}
    </Button>
  );
}

export function WooTestButton({ canTest }: { canTest: boolean }) {
  const [state, formAction] = useActionState(testWooConnectionAction, initialWooTestState);

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <TestButton disabled={!canTest} />
      </form>

      {!canTest ? (
        <Alert variant="warning">Configure all WooCommerce environment variables before testing.</Alert>
      ) : null}

      <ActionFeedback
        status={state.status === "idle" ? "idle" : state.status}
        message={state.message}
      />
    </div>
  );
}
