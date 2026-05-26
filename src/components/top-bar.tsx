"use client";

import { LogoutButton } from "@/features/auth/logout-button";
import { formatShortcut } from "@/lib/ui/use-keyboard-shortcut";

export function TopBar() {
  return (
    <header className="hidden shrink-0 border-b border-border bg-surface px-page-x py-3 md:flex md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-caption text-muted-foreground">Welcome back</p>
        <h1 className="truncate text-lg font-semibold text-foreground md:text-xl">Invexio Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <p className="hidden text-caption text-muted-foreground lg:block">
          <kbd className="rounded border border-border px-1.5 py-0.5 font-sans text-[0.65rem]">
            {formatShortcut("mod+k")}
          </kbd>{" "}
          commands
        </p>
        <LogoutButton />
      </div>
    </header>
  );
}
