-- Starter RLS policies for local development (idempotent).
-- Inventory enforcement remains: stock changes only via record_inventory_movement().

-- ---------------------------------------------------------------------------
-- RLS enable (safe if already enabled in initial migration)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.woo_connections enable row level security;
alter table public.sync_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Drop prior starter policies (safe rerun)
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

drop policy if exists products_select_authenticated on public.products;
drop policy if exists products_update_authenticated on public.products;

drop policy if exists inventory_movements_select_authenticated on public.inventory_movements;
drop policy if exists inventory_movements_insert_authenticated on public.inventory_movements;

drop policy if exists orders_select_authenticated on public.orders;
drop policy if exists orders_insert_authenticated on public.orders;
drop policy if exists orders_update_authenticated on public.orders;
drop policy if exists orders_delete_authenticated on public.orders;

drop policy if exists order_items_select_authenticated on public.order_items;
drop policy if exists order_items_insert_authenticated on public.order_items;
drop policy if exists order_items_update_authenticated on public.order_items;
drop policy if exists order_items_delete_authenticated on public.order_items;

drop policy if exists woo_connections_select_authenticated on public.woo_connections;
drop policy if exists sync_logs_select_authenticated on public.sync_logs;

-- ---------------------------------------------------------------------------
-- profiles: own row only
-- ---------------------------------------------------------------------------
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Read-only operational tables for authenticated users
-- ---------------------------------------------------------------------------
create policy products_select_authenticated
  on public.products
  for select
  to authenticated
  using (true);

create policy inventory_movements_select_authenticated
  on public.inventory_movements
  for select
  to authenticated
  using (true);

create policy orders_select_authenticated
  on public.orders
  for select
  to authenticated
  using (true);

create policy order_items_select_authenticated
  on public.order_items
  for select
  to authenticated
  using (true);

create policy woo_connections_select_authenticated
  on public.woo_connections
  for select
  to authenticated
  using (true);

create policy sync_logs_select_authenticated
  on public.sync_logs
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Manual in-app orders (required by createManualOrderAction)
-- Writes to products/inventory/sync remain service-role or RPC-only.
-- ---------------------------------------------------------------------------
create policy orders_insert_authenticated
  on public.orders
  for insert
  to authenticated
  with check (true);

create policy orders_delete_authenticated
  on public.orders
  for delete
  to authenticated
  using (true);

create policy order_items_insert_authenticated
  on public.order_items
  for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Stock changes: authenticated may EXECUTE RPC only.
-- Function runs as definer so movement insert + stock update bypass table RLS,
-- while prevent_direct_stock_update trigger still blocks direct client stock edits.
-- ---------------------------------------------------------------------------
alter function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid)
  security definer
  set search_path = public;

revoke all on function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid) from public;
grant execute on function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid) to authenticated;
grant execute on function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid) to service_role;
