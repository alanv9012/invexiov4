import { ProfileForm } from "@/features/settings/profile-form";
import type { SettingsPageData } from "@/features/settings/types";
import { WooTestButton } from "@/features/settings/woo-test-button";
import { formatDateTime } from "@/lib/format";

type SettingsContentProps = {
  data: SettingsPageData;
};

function ConfigBadge({ configured, label }: { configured: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
      <span className="text-slate-700">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          configured
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}
      >
        {configured ? "Configured" : "Missing"}
      </span>
    </div>
  );
}

export function SettingsContent({ data }: SettingsContentProps) {
  if (data.errorMessage) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-800">Settings unavailable</h2>
        <p className="mt-2 text-sm text-rose-700">{data.errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage store connection, integrations, profile, and app preferences.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">Store connection</h3>
        <p className="mt-1 text-sm text-slate-600">
          Connection metadata stored in Supabase. API credentials remain in server environment
          variables only.
        </p>

        {data.wooConnection ? (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Connection name</dt>
              <dd className="font-medium text-slate-900">{data.wooConnection.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Store URL</dt>
              <dd className="font-medium text-slate-900">{data.wooConnection.storeUrl}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Last successful sync</dt>
              <dd className="text-slate-900">
                {data.wooConnection.lastSuccessfulSyncAt
                  ? formatDateTime(data.wooConnection.lastSuccessfulSyncAt)
                  : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Last error</dt>
              <dd className="text-slate-900">
                {data.wooConnection.lastErrorMessage ?? "None recorded"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No active WooCommerce connection record found. Sync products from the Sync page to
            create connection metadata.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">WooCommerce API status</h3>
        <p className="mt-1 text-sm text-slate-600">
          Environment configuration is checked server-side. Secret values are never shown in the
          UI.
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
          <p className="mt-3 text-sm text-slate-600">
            Store URL: <span className="font-medium text-slate-900">{data.wooEnv.storeUrlDisplay}</span>
          </p>
        ) : null}

        <div className="mt-4">
          <WooTestButton canTest={data.wooEnv.allConfigured} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">User profile</h3>
        <p className="mt-1 text-sm text-slate-600">Update your display name used across Invexio.</p>
        <div className="mt-4">
          {data.profile ? <ProfileForm profile={data.profile} /> : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">App preferences</h3>
        <p className="mt-1 text-sm text-slate-600">
          Personal UI preferences. Persistence will be expanded in a future release.
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-3 py-3 text-sm">
            <span className="text-slate-700">Show low-stock highlights on dashboard</span>
            <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded border-slate-300" />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-3 py-3 text-sm">
            <span className="text-slate-700">Email alerts for failed syncs</span>
            <input type="checkbox" disabled className="h-4 w-4 rounded border-slate-300" />
          </label>
          <div className="rounded-md border border-slate-200 px-3 py-3 text-sm">
            <label htmlFor="defaultCurrency" className="mb-1 block text-slate-700">
              Default currency display
            </label>
            <select
              id="defaultCurrency"
              disabled
              defaultValue="USD"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
            >
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
