import type { DashboardData } from "@/features/dashboard/types";
import { ActivityFeed } from "@/features/dashboard/activity-feed";
import { DashboardCharts } from "@/features/dashboard/dashboard-charts";
import { DashboardMetrics } from "@/features/dashboard/dashboard-metrics";
import { Alert } from "@/components/ui/alert";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SyncLogStatusBadge } from "@/components/ui/inventory-badges";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";

type DashboardContentProps = {
  data: DashboardData;
};

export function DashboardContent({ data }: DashboardContentProps) {
  if (data.errorMessage) {
    return (
      <Alert variant="danger" title="Dashboard unavailable">
        {data.errorMessage}
      </Alert>
    );
  }

  const hasNoData =
    data.totalProducts === 0 &&
    data.recentOrdersCount === 0 &&
    data.movementsToday === 0 &&
    data.activityFeed.length === 0;

  return (
    <div className="space-y-6 animate-page-enter">
      <SectionHeader
        size="page"
        title="Dashboard"
        description="Analytics and live activity from your Supabase inventory and order data."
        action={
          <Button href="/sync" variant="secondary" size="sm">
            Open sync
          </Button>
        }
      />

      {hasNoData ? (
        <EmptyState
          title="Welcome to Invexio"
          description="Connect WooCommerce, sync products, and start tracking inventory to populate your dashboard."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button href="/sync">Configure sync</Button>
              <Button href="/products" variant="secondary">
                View products
              </Button>
            </div>
          }
        />
      ) : null}

      <DashboardMetrics data={data} />
      <DashboardCharts data={data} />
      <ActivityFeed items={data.activityFeed} />

      <Card padding="md">
        <CardTitle>Sync status summary</CardTitle>
        <CardDescription>Counts from the 100 most recent sync log entries.</CardDescription>
        {data.syncSummary.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              variant="inline"
              title="No sync activity"
              description="Run a product or order sync to see status breakdowns here."
              action={<Button href="/sync" size="sm">Go to sync</Button>}
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.syncSummary.map((item) => (
              <SyncLogStatusBadge
                key={`${item.type}-${item.status}`}
                type={item.type}
                status={item.status}
                count={item.count}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
