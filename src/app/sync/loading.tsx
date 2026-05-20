import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SyncLoadingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-card border border-border" />
        <Card padding="lg" className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-9 w-56" />
        </Card>
        <Card padding="lg" className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-9 w-52" />
        </Card>
      </div>
    </DashboardLayout>
  );
}
