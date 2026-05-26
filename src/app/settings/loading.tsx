import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { LoadingRegion } from "@/components/ui/loading-region";
import { PageContent } from "@/components/ui/page-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoadingPage() {
  return (
    <DashboardLayout>
      <PageContent>
        <LoadingRegion label="Loading settings">
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
        </LoadingRegion>
      </PageContent>
    </DashboardLayout>
  );
}
