import { Card } from "@/components/ui/card";
import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonMetrics } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";

export function DashboardLoading() {
  return (
    <LoadingRegion label="Loading dashboard" className="space-y-6">
      <SectionHeader
        size="page"
        title={<Skeleton className="h-8 w-44" />}
        description={<Skeleton className="h-4 w-80 max-w-full" />}
        action={<Skeleton className="h-8 w-24" />}
      />

      <SkeletonMetrics count={5} />

      <section className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} padding="md" className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </Card>
        ))}
      </section>

      <Card padding="md" className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-3 rounded-lg p-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </Card>

      <Card padding="md" className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </Card>
    </LoadingRegion>
  );
}
