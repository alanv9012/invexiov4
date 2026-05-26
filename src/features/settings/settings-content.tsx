import { ProfileForm } from "@/features/settings/profile-form";
import type { SettingsPageData } from "@/features/settings/types";
import { WooTestButton } from "@/features/settings/woo-test-button";
import { formatDateTime } from "@/lib/format";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
type SettingsContentProps = {
  data: SettingsPageData;
};

function ConfigBadge({ configured, label }: { configured: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-body-sm">
      <span className="text-foreground">{label}</span>
      <Badge variant={configured ? "success" : "danger"} size="sm">
        {configured ? "Configured" : "Missing"}
      </Badge>
    </div>
  );
}

export function SettingsContent({ data }: SettingsContentProps) {
  if (data.errorMessage) {
    return (
      <Alert variant="danger" title="Settings unavailable">
        {data.errorMessage}
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-page-enter">
      <SectionHeader
        size="page"
        title="Settings"
        description="Manage store connection, integrations, profile, and app preferences."
      />

      <Card padding="md">
        <CardTitle>Store connection</CardTitle>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Connection metadata stored in Supabase. API credentials remain in server environment
          variables only.
        </p>

        {data.wooConnection ? (
          <dl className="mt-4 grid gap-2 text-body-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Connection name</dt>
              <dd className="font-medium text-foreground">{data.wooConnection.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Store URL</dt>
              <dd className="font-medium text-foreground">{data.wooConnection.storeUrl}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last successful sync</dt>
              <dd className="text-foreground">
                {data.wooConnection.lastSuccessfulSyncAt
                  ? formatDateTime(data.wooConnection.lastSuccessfulSyncAt)
                  : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last error</dt>
              <dd className="text-foreground">{data.wooConnection.lastErrorMessage ?? "None recorded"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-body-sm text-muted-foreground">
            No active WooCommerce connection record found. Sync products from the Sync page to
            create connection metadata.
          </p>
        )}
      </Card>

      <Card padding="md">
        <CardTitle>WooCommerce API status</CardTitle>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Environment configuration is checked server-side. Secret values are never shown in the UI.
        </p>

        <div className="mt-4 space-y-2">
          <ConfigBadge configured={data.wooEnv.storeUrlConfigured} label="WOOCOMMERCE_STORE_URL" />
          <ConfigBadge
            configured={data.wooEnv.consumerKeyConfigured}
            label="WOOCOMMERCE_CONSUMER_KEY"
          />
          <ConfigBadge
            configured={data.wooEnv.consumerSecretConfigured}
            label="WOOCOMMERCE_CONSUMER_SECRET"
          />
        </div>

        {data.wooEnv.storeUrlDisplay ? (
          <p className="mt-3 text-body-sm text-muted-foreground">
            Store URL: <span className="font-medium text-foreground">{data.wooEnv.storeUrlDisplay}</span>
          </p>
        ) : null}

        <div className="mt-4">
          <WooTestButton canTest={data.wooEnv.allConfigured} />
        </div>
      </Card>

      <Card padding="md">
        <CardTitle>User profile</CardTitle>
        <p className="mt-1 text-body-sm text-muted-foreground">Update your display name used across Invexio.</p>
        <div className="mt-4">{data.profile ? <ProfileForm profile={data.profile} /> : null}</div>
      </Card>

      <Card padding="md">
        <CardTitle>App preferences</CardTitle>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Personal UI preferences. Persistence will be expanded in a future release.
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3 text-body-sm">
            <span className="text-foreground">Show low-stock highlights on dashboard</span>
            <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded border-border-strong" />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3 text-body-sm">
            <span className="text-foreground">Email alerts for failed syncs</span>
            <input type="checkbox" disabled className="h-4 w-4 rounded border-border-strong" />
          </label>
          <div className="rounded-md border border-border px-3 py-3 text-body-sm">
            <label htmlFor="defaultCurrency" className="mb-1 block text-foreground">
              Default currency display
            </label>
            <Select
              id="defaultCurrency"
              disabled
              defaultValue="USD"
              className="bg-surface-muted text-muted-foreground"
            >
              <option value="USD">USD</option>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}
