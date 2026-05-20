import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardLoading } from "@/features/dashboard/dashboard-loading";

export default function DashboardLoadingPage() {
  return (
    <DashboardLayout>
      <DashboardLoading />
    </DashboardLayout>
  );
}
