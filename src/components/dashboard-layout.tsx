"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface px-page-x py-3 md:hidden">
        <Button type="button" size="sm" onClick={() => setIsMobileOpen((current) => !current)}>
          {isMobileOpen ? "Close menu" : "Open menu"}
        </Button>
      </div>

      <div className="flex min-h-screen">
        <aside className="hidden shrink-0 md:block">
          <SidebarNav />
        </aside>

        {isMobileOpen ? (
          <aside className="fixed inset-0 z-30 md:hidden" aria-hidden={!isMobileOpen}>
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close navigation menu"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative h-full w-sidebar shadow-drawer">
              <SidebarNav />
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className={cn("mx-auto w-full max-w-content flex-1 px-page-x py-page-y")}>{children}</main>
        </div>
      </div>
    </div>
  );
}
