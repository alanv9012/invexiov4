import { DashboardLayout } from "@/components/dashboard-layout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">
          This is the starter dashboard view for Invexio.
        </p>
      </section>
    </DashboardLayout>
  );
}
