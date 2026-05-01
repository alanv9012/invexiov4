import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Inventory", href: "/inventory" },
  { label: "Orders", href: "/orders" },
  { label: "Sync", href: "/sync" },
  { label: "Settings", href: "/settings" }
];

export function SidebarNav() {
  return (
    <nav className="flex h-full flex-col gap-2 bg-slate-900 p-4 text-slate-100">
      <div className="mb-3 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Invexio</p>
        <p className="text-lg font-semibold">Inventory Hub</p>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-800"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
