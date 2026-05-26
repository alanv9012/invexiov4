"use client";

import { useEffect, useState } from "react";
import { ProductivityShell } from "@/components/productivity/productivity-shell";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setIsMobileOpen(false);
      }
    };
    closeOnDesktop();
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <ProductivityShell />
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-expanded={isMobileOpen}
          aria-controls="mobile-sidebar"
          onClick={() => setIsMobileOpen((current) => !current)}
        >
          {isMobileOpen ? "Close" : "Menu"}
        </Button>
        <p className="truncate text-sm font-semibold text-foreground">Invexio</p>
        <div className="w-[4.5rem] shrink-0" aria-hidden />
      </header>

      <div className="flex min-h-[calc(100dvh-3.25rem)] md:min-h-screen">
        <aside className="hidden shrink-0 md:block">
          <SidebarNav />
        </aside>

        {isMobileOpen ? (
          <aside
            id="mobile-sidebar"
            className="fixed inset-0 z-40 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 transition-opacity duration-200"
              aria-label="Close navigation menu"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative h-full w-[min(100%,20rem)] shadow-drawer">
              <SidebarNav onNavigate={() => setIsMobileOpen(false)} />
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main
            className={cn(
              "mx-auto w-full min-w-0 max-w-content flex-1 px-4 py-4",
              "pb-[max(1rem,env(safe-area-inset-bottom))] md:px-page-x md:py-page-y"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
