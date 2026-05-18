import { DashboardLayout } from "@/components/dashboard-layout";

export default function SettingsLoadingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </DashboardLayout>
  );
}
