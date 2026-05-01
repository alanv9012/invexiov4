"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((current) => !current)}
          className="m-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          {isMobileOpen ? "Close Menu" : "Open Menu"}
        </button>
      </div>

      <div className="flex min-h-screen">
        <aside className="hidden w-64 md:block">
          <SidebarNav />
        </aside>

        {isMobileOpen ? (
          <aside className="fixed inset-0 z-30 bg-black/40 md:hidden">
            <div className="h-full w-64">
              <SidebarNav />
            </div>
          </aside>
        ) : null}

        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
