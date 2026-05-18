import { DashboardLayout } from "@/components/dashboard-layout";
import { getSettingsPageData } from "@/features/settings/queries";
import { SettingsContent } from "@/features/settings/settings-content";

export default async function SettingsPage() {
  const data = await getSettingsPageData();

  return (
    <DashboardLayout>
      <SettingsContent data={data} />
    </DashboardLayout>
  );
}
