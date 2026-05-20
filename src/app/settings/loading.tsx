import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoadingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card padding="md" className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
        </Card>
        <Card padding="md" className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-32 w-full" />
        </Card>
        <Card padding="md" className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    </DashboardLayout>
  );
}
