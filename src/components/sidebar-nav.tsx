"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/logout-button";
import { cn } from "@/lib/ui/cn";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Inventory", href: "/inventory" },
  { label: "Orders", href: "/orders" },
  { label: "Sync", href: "/sync" },
  { label: "Settings", href: "/settings" }
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex h-full w-full max-w-[16rem] flex-col gap-1 bg-sidebar p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sidebar-foreground md:w-sidebar",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2 px-2 md:block">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sidebar-muted">Invexio</p>
          <p className="text-lg font-semibold">Inventory Hub</p>
        </div>
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-md px-3 py-2 text-sm text-sidebar-muted transition hover:bg-sidebar-accent hover:text-white md:hidden"
            aria-label="Close menu"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/90 hover:bg-sidebar-accent/80 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-sidebar-accent/40 px-2 pt-4 [&_button]:w-full md:[&_button]:w-auto">
        <LogoutButton />
      </div>
    </nav>
  );
}
