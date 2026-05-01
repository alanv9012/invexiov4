import { DashboardLayout } from "@/components/dashboard-layout";

export default function SyncPage() {
  return (
    <DashboardLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Sync</h2>
        <p className="mt-2 text-sm text-slate-600">
          Placeholder page for WooCommerce import/export runs and retry actions.
        </p>
      </section>
    </DashboardLayout>
  );
}
