"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { initialUpdateProfileState, updateProfileAction } from "@/features/settings/actions";
import type { SettingsProfile } from "@/features/settings/types";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save profile"}
    </Button>
  );
}

export function ProfileForm({ profile }: { profile: SettingsProfile }) {
  const [state, formAction] = useActionState(updateProfileAction, initialUpdateProfileState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          value={profile.email}
          readOnly
          className="border-border bg-surface-muted text-muted-foreground"
        />
      </FormField>

      <FormField label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" type="text" required defaultValue={profile.fullName ?? ""} />
      </FormField>

      <div>
        <p className="text-sm font-medium text-foreground">Role</p>
        <Badge variant="neutral" className="mt-2 capitalize">
          {profile.role}
        </Badge>
      </div>

      <ActionFeedback
        status={state.status === "idle" ? "idle" : state.status}
        message={state.message}
      />

      <SaveButton />
    </form>
  );
}
