import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardContent } from "@/features/dashboard/dashboard-content";
import { getDashboardData } from "@/features/dashboard/queries";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <DashboardLayout>
      <DashboardContent data={data} />
    </DashboardLayout>
  );
}
