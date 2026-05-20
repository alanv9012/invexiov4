"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-sidebar flex-col gap-1 bg-sidebar p-4 text-sidebar-foreground">
      <div className="mb-4 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-sidebar-muted">Invexio</p>
        <p className="text-lg font-semibold">Inventory Hub</p>
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium transition duration-150",
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
    </nav>
  );
}
