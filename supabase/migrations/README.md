# Invexio Supabase migrations

Apply in order:

1. `20260501133000_initial_invexio_schema.sql`
2. `20260511143000_add_customer_phone_to_orders.sql` — required for manual orders (`customer_phone`); safe to rerun
3. `20260518160000_rls_starter_policies.sql` — **required** after initial schema (RLS is enabled without policies until this runs)
4. `20261015120000_a1_authorization_foundation.sql` — authorization helpers, profile column grants, and anonymous RPC revocation
5. `20261015130000_a2_rls_and_admin_data_security.sql` — active-user RLS, explicit API grants, Owner-only administrative data, and inventory RPC authorization

## Local setup

```bash
supabase db reset    # recommended for local dev
# or
supabase migration up
```

## Authenticated user access (after RLS migration)

| Resource | Allowed |
|----------|---------|
| `profiles` | Active users select own row and update own `full_name`; Owner may select all profiles |
| `products` | Active Owner/staff-equivalent users select only |
| `inventory_movements` | Active Owner selects only (rows created via RPC) |
| `orders` | Active Owner/staff-equivalent users select; constrained manual insert and temporary rollback delete |
| `order_items` | Active Owner/staff-equivalent users select; constrained manual-order insert |
| `woo_connections` | Active Owner selects only |
| `sync_logs` | Active Owner selects only |
| `record_inventory_movement()` | **Execute** (temporary until the Phase B transactional order cutover) |

## Service-role access (`SUPABASE_SERVICE_ROLE_KEY`)

Bypasses RLS. Used for:

- WooCommerce product sync
- WooCommerce order sync
- Planned invitation and owner-managed profile bootstrap workflows
- Product catalog upserts during sync
- `sync_logs` / `woo_connections` writes during sync jobs

## Inventory protection

- Clients cannot update `products.stock_quantity` directly (trigger blocks unless `app.allow_stock_update` is set inside `record_inventory_movement()`).
- Authenticated Owner adjustments require `inventory.adjust`.
- Manual-sale deductions must match the authenticated user's order, one order item, product, and quantity.
- A manual-sale deduction and its exact rollback can each be recorded only once.
- Service-role synchronization retains the existing RPC path.

## Temporary Phase B compatibility

Authenticated order insert, order-item insert, order rollback delete, and inventory RPC execution remain available only through constrained A2 policies and function checks. Phase B will replace this multi-request workflow with one atomic database function and revoke those direct grants.

Anonymous users cannot execute `record_inventory_movement()` after A1. Public application signup is disabled in the application, and Supabase Auth public signup must remain disabled in deployed environments.

## Hosted development deployment

The hosted development project did not have a Supabase migration-history table when A1 was deployed through the SQL Editor. Until migration history is deliberately baselined, apply only the reviewed new migration through the SQL Editor as one transaction. Do not use `supabase db push`, replay historical migrations, or reset the hosted database.

## A2 order locking and recovery

Manual deductions and rollbacks update/lock the order row before locking a
product. The item-insertion trigger uses the same parent-row lock before FK
checks and refuses duplicate products or any insertion after the first manual
movement. Updating the parent also forces stale REPEATABLE READ transactions to
fail serialization instead of checking an old item/ledger snapshot.

DELETE locks the order row. Its VOLATILE BEFORE trigger then checks the net
manual movement balance using a fresh query. RLS remains an early authorization
filter; it is not the concurrency barrier. This trigger applies to Owners and
service-role callers too: orders with unrestored stock must remain for recovery.
Normal WooCommerce synchronization does not create manual movement references
and retains its existing path. The single-order application requests follow
order → product → original movement lock order.

A2 fails migration if API roles have unexpected memberships (including
NOINHERIT membership), elevated attributes, table/column permissions, grant
options, exposed trigger functions, or unexpected policies. Hosted memberships
have not been inspected by these local tests; perform a read-only preflight
before deployment. No membership is automatically removed.

Manual-sale error handling verifies compensation and a returned deleted row.
Ambiguous transport failures retain the order even against the older A1 database;
only recognized transaction-aborting PostgreSQL errors confirm rollback;
connection/completion-unknown errors remain uncertain.
Messages provide an order reference and instruct the user not to retry blindly.
There is no automatic reconciler yet. Phase B must still provide atomic sale
creation, request idempotency, trusted completion state, and Owner-only cancellation.
Staff can still invoke the permitted exact rollback of their own successful sale;
A2 cannot distinguish that from legitimate compensation.

## A2 disposable regression procedure

Use a NEW scratch directory outside this repository, pinned CLI **2.121.0**, a
unique project ID, and unused local ports (tests below use database port 55322).
Copy only the five migrations and tests. Do not copy environment files, hosted
links, or the owner-bootstrap script. `supabase start` applies the scratch
migrations in chronological order. Never run this procedure against a linked or
hosted project. The test runners hardcode loopback and local credentials.

```bash
# In the isolated scratch directory, after supabase init and local-port setup:
npx --yes supabase@2.121.0 start
# From the repository (SQL fixtures/helpers end with ROLLBACK):
PGPASSWORD=postgres psql -X -h 127.0.0.1 -p 55322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/tests/a1_authorization_foundation.sql
PGPASSWORD=postgres psql -X -h 127.0.0.1 -p 55322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/tests/a2_rls_and_admin_data_security.sql
python3 supabase/tests/a2_concurrency.py --port 55322 --disposable-local
python3 supabase/tests/a2_privilege_preflight.py --port 55322 --disposable-local
node tests/a2-application.test.cjs
# From the SAME scratch directory only:
npx --yes supabase@2.121.0 stop --no-backup
```

Concurrency tests explicitly observe a second session waiting on a database
lock before releasing the first; no race is inferred merely from a timed sleep.
Cross-session fixtures must commit and are removed by UUID in `finally`; destroy
the disposable stack if the process is interrupted. The runner refuses a
nonempty application/Auth database. Privilege tests inject grants into an
execution copy of the migration and verify failure/rollback, never alter the
repository migration, and finish with the expected grants unchanged.

Coverage includes both deduction/delete orderings, concurrent duplicate
movements/credits/items, both insertion/deduction orderings, stale snapshots,
multi-product compensation, failed compensation, and committed-but-unobserved
RPC results. Application mocks model permissive A1 reads and transport failures.
An actual dropped HTTP response, browser session, WooCommerce outage, and process
termination during a sale are not end-to-end automated here; the mocks and SQL
checks cover their relevant response/state boundaries, not the complete network.

Deploy the corrected application first and drain old instances before the A2 SQL
transaction. Verify Owner login/profile editing/adjustments, staff manual sales,
and denied admin access. Do not revert to the old unguarded service-role actions
as a rollback strategy. Keep deployment paused pending independent review.
