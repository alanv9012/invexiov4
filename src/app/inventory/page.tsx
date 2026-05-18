import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Inventory</h2>
        <p className="mt-2 text-sm text-slate-600">
          Stock adjustments and movement history are managed from the Products page. Every stock
          change is recorded in the inventory movements ledger.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Go to Products
        </Link>
      </section>
    </DashboardLayout>
  );
}
