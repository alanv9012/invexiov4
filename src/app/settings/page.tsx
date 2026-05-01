import { DashboardLayout } from "@/components/dashboard-layout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <p className="mt-2 text-sm text-slate-600">
          Placeholder page for app configuration, roles, and integrations.
        </p>
      </section>
    </DashboardLayout>
  );
}
