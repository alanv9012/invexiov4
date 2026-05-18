"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialUpdateProfileState, updateProfileAction } from "@/features/settings/actions";
import type { SettingsProfile } from "@/features/settings/types";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save profile"}
    </button>
  );
}

export function ProfileForm({ profile }: { profile: SettingsProfile }) {
  const [state, formAction] = useActionState(updateProfileAction, initialUpdateProfileState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={profile.email}
          readOnly
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
        />
      </div>

      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={profile.fullName ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">Role</p>
        <p className="mt-1 text-sm capitalize text-slate-600">{profile.role}</p>
      </div>

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

      <SaveButton />
    </form>
  );
}
