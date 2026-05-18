import { DashboardLayout } from "@/components/dashboard-layout";

export default function SyncLoadingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </DashboardLayout>
  );
}
