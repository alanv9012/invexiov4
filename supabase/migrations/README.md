# Invexio Supabase migrations

Apply in order:

1. `20260501133000_initial_invexio_schema.sql`
2. `20260511143000_add_customer_phone_to_orders.sql` — required for manual orders (`customer_phone`); safe to rerun
3. `20260518160000_rls_starter_policies.sql` — **required** after initial schema (RLS is enabled without policies until this runs)
4. `20261015120000_a1_authorization_foundation.sql` — authorization helpers, profile column grants, and anonymous RPC revocation

## Local setup

```bash
supabase db reset    # recommended for local dev
# or
supabase migration up
```

## Authenticated user access (after RLS migration)

| Resource | Allowed |
|----------|---------|
| `profiles` | Select own row; update own `full_name` only |
| `products` | **Select only** |
| `inventory_movements` | **Select only** (rows created via RPC) |
| `orders` | Select, insert, delete (manual orders + rollback) |
| `order_items` | Select, insert (manual orders) |
| `woo_connections` | **Select only** |
| `sync_logs` | **Select only** |
| `record_inventory_movement()` | **Execute** (temporary until the Phase B transactional order cutover) |

## Service-role access (`SUPABASE_SERVICE_ROLE_KEY`)

Bypasses RLS. Used for:

- WooCommerce product sync
- WooCommerce order sync
- Planned invitation and owner-managed profile bootstrap workflows
- Product catalog upserts during sync
- `sync_logs` / `woo_connections` writes during sync jobs

## Inventory protection (unchanged)

- Clients cannot update `products.stock_quantity` directly (trigger blocks unless `app.allow_stock_update` is set inside `record_inventory_movement()`).
- All stock deltas must go through `record_inventory_movement()`.

## Local dev security tradeoff

Starter policies let any **authenticated** user read all operational data and create manual orders. This is intentional for small-team local development. Tighten by role/tenant before production.

Anonymous users cannot execute `record_inventory_movement()` after A1. Public application signup is disabled in the application; disabling public signup in Supabase Auth is a separate deployment step.
