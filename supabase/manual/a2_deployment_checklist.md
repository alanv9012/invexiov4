# A2 hosted-development deployment checklist

This sequence is application first and database second. The hosted project is
currently tracked as an A1 database applied through the SQL Editor, without a
confirmed migration-history baseline.

## 1. Establish the preflight baseline

1. Confirm the intended hosted project reference in the Supabase dashboard.
2. Run `supabase/manual/a2_hosted_preflight.sql` manually in that project's SQL
   Editor. It is a read-only transaction and returns no user identifiers,
   emails, credentials, or WooCommerce values.
3. Save the output privately with the deployment record. Resolve every `FAIL`.
   Review every `WARN`; expected A1 authenticated table access is removed by A2.
4. Confirm exactly one active Owner, no missing profiles, no inherited API-role
   memberships, all four required functions, the expected A1 policy/table
   pairs, and no A2 policies or guard triggers.
5. If `supabase_migrations.schema_migrations` is absent, keep using the SQL
   Editor procedure below. Do not run `supabase db push`, replay historical
   migrations, or reset the hosted database.

## 2. Deploy and drain the A2 application

1. Deploy the reviewed application commit while the database remains on A1.
2. Shift the application hostname or traffic target completely to the new
   deployment. Remove the old deployment from load balancers and process
   supervisors. For immutable/serverless hosting, remove its production alias
   and protect or disable any directly addressable old deployment URL.
3. Stop accepting new work on old long-lived processes, let active requests
   finish, then terminate those processes. Observe platform invocation/access
   logs until the old deployment has had no requests for at least the platform's
   maximum request duration plus its connection-drain interval.
4. Verify the new deployment against A1 before changing the database:
   - Owner can sign in and edit `full_name`.
   - Owner can open Products, Orders, Settings, and Sync pages.
   - A Sales Assistant can open products, inventory, customer/delivery details,
     individual orders, and individual totals.
   - A Sales Assistant cannot reach user, integration, sync-administration,
     arbitrary inventory-adjustment, price-management, or aggregate-financial
     operations through direct URLs or Server Actions.
   - The staff dashboard contains no inventory-movement or sync-diagnostic data.
   - A controlled manual sale completes without WooCommerce availability. Record
     its order reference and resulting stock so the database cutover can be
     reconciled if a later check fails.
5. Do not continue while an old application instance can still receive traffic.
   Its privileged service-role paths predate the A2 application guards.

## 3. Apply only A2

1. Open `supabase/migrations/20261015130000_a2_rls_and_admin_data_security.sql`
   from the exact reviewed Git revision. Verify its checksum against the tested
   artifact.
2. Paste the complete file into the hosted development SQL Editor. Do not edit
   statements in the browser. The migration's `begin`/`commit` makes its schema,
   policy, grant, function, and trigger changes one transaction.
3. Execute once. If any assertion raises an exception, confirm the transaction
   rolled back and stop. Do not remove or weaken an assertion in the SQL Editor.
4. Do not run the Owner bootstrap, historical migrations, local test fixtures,
   `supabase db reset`, or `supabase db push`.

## 4. Verify after the database commit

1. Re-run the preflight's catalog/detail queries as a post-deployment record.
   The preflight summary's “A2 objects are not already deployed” check will now
   intentionally show `FAIL`; confirm instead that all expected `a2_*` policies,
   both guard triggers, and `can_delete_manual_order(uuid)` are present.
2. Confirm anonymous users have no table or helper/RPC execution access;
   authenticated users have only the explicit A2 table/column grants; trigger
   functions are not executable by API roles; and role memberships are unchanged.
3. Repeat Owner and Sales Assistant navigation/authorization checks.
4. Create one controlled manual sale and verify exactly one deduction movement,
   the expected stock decrease, and continued operation while WooCommerce is
   unavailable. Verify duplicate submission does not produce another movement.
5. Exercise one controlled pre-deduction cleanup and one exact compensation path.
   Keep any order whose compensation result is uncertain and use its displayed
   order reference for manual investigation.
6. Review application and Supabase logs for authorization errors, failed
   compensation, policy recursion, SQLSTATE `42501`, serialization failures, or
   unexpected service-role requests.

## 5. Failure handling

An error before `commit` rolls back A2 automatically. Keep the new application
deployed because it is designed to run on A1 and contains the service-role and
dashboard protections. Do not restore the older application.

After a successful database commit, do not improvise a partial SQL rollback.
Pause manual sales, preserve affected order references and logs, and prepare a
reviewed forward correction. If the application must be taken out of service,
use a maintenance response or remove traffic; do not re-enable old instances.
