"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialWooTestState, testWooConnectionAction } from "@/features/settings/actions";

function TestButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Testing..." : "Test connection"}
    </button>
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
        <p className="text-sm text-amber-700">
          Configure all WooCommerce environment variables before testing.
        </p>
      ) : null}

      {state.status === "success" && state.message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
