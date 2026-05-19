-- Initial Invexio schema
-- Includes core inventory, order, WooCommerce sync, and audit tables.

create extension if not exists pgcrypto;

-- Shared updated_at trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Prevent stock updates that do not go through movement tracking.
create or replace function public.prevent_direct_stock_update()
returns trigger
language plpgsql
as $$
begin
  if new.stock_quantity is distinct from old.stock_quantity
     and coalesce(current_setting('app.allow_stock_update', true), '') <> 'on' then
    raise exception 'Direct stock updates are blocked. Use public.record_inventory_movement().';
  end if;

  return new;
end;
$$;

-- User profile data tied to Supabase Auth users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App-level profile and role metadata for authenticated users.';

-- Product catalog synced with WooCommerce and used for local inventory reads/writes.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  woo_product_id bigint,
  woo_variation_id bigint,
  sku text not null,
  name text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  manage_stock boolean not null default true,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  image_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Inventory products with WooCommerce identifiers and sync metadata.';

-- Inventory adjustments and stock deltas for full auditability.
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  previous_quantity integer not null check (previous_quantity >= 0),
  change_quantity integer not null,
  new_quantity integer not null check (new_quantity >= 0),
  reason text not null,
  source text not null check (source in ('manual', 'woocommerce', 'sync', 'system')),
  user_id uuid references public.profiles (id) on delete set null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now(),
  constraint inventory_movements_quantity_consistency
    check (previous_quantity + change_quantity = new_quantity)
);

comment on table public.inventory_movements is 'Immutable stock movement ledger; every product stock change must be recorded here.';

-- Orders in Invexio with optional WooCommerce linkage.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  woo_order_id bigint unique,
  order_number text,
  status text not null default 'pending',
  currency text not null default 'USD' check (char_length(currency) = 3),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  customer_name text,
  customer_email text,
  source text not null default 'manual' check (source in ('manual', 'woocommerce', 'system')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  ordered_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is 'Sales orders managed by Invexio and optionally synchronized with WooCommerce.';

-- Order line items mapped to products and WooCommerce line IDs.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  woo_line_item_id bigint,
  sku text,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.order_items is 'Order item rows with product snapshots and WooCommerce line references.';

-- WooCommerce store connection metadata (keys remain in environment variables).
create table if not exists public.woo_connections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  store_url text not null unique,
  is_active boolean not null default true,
  webhook_secret_hint text,
  last_successful_sync_at timestamptz,
  last_health_check_at timestamptz,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.woo_connections is 'WooCommerce endpoint connection metadata and operational health data.';

-- Sync execution audit records across products, orders, and inventory jobs.
create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  woo_connection_id uuid references public.woo_connections (id) on delete set null,
  type text not null check (type in ('products', 'orders', 'inventory', 'connection')),
  status text not null check (status in ('queued', 'running', 'success', 'failed')),
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.sync_logs is 'Detailed sync history with status, context payload, and error diagnostics.';

-- Useful indexes
create unique index if not exists products_woo_ids_unique_idx
  on public.products (woo_product_id, woo_variation_id)
  where woo_product_id is not null;

create unique index if not exists products_sku_unique_idx on public.products (sku);
create index if not exists products_last_synced_at_idx on public.products (last_synced_at);
create index if not exists inventory_movements_product_created_idx on public.inventory_movements (product_id, created_at desc);
create index if not exists inventory_movements_user_idx on public.inventory_movements (user_id);
create index if not exists orders_source_status_idx on public.orders (source, status);
create index if not exists orders_ordered_at_idx on public.orders (ordered_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists sync_logs_type_status_created_idx on public.sync_logs (type, status, created_at desc);
create index if not exists sync_logs_connection_idx on public.sync_logs (woo_connection_id);

-- updated_at triggers (idempotent for local reset/rerun workflows)
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists set_order_items_updated_at on public.order_items;
create trigger set_order_items_updated_at
before update on public.order_items
for each row
execute function public.set_updated_at();

drop trigger if exists set_woo_connections_updated_at on public.woo_connections;
create trigger set_woo_connections_updated_at
before update on public.woo_connections
for each row
execute function public.set_updated_at();

drop trigger if exists prevent_products_stock_update on public.products;
create trigger prevent_products_stock_update
before update of stock_quantity on public.products
for each row
execute function public.prevent_direct_stock_update();

-- Public API for stock adjustments that always records inventory movement.
create or replace function public.record_inventory_movement(
  p_product_id uuid,
  p_change_quantity integer,
  p_reason text,
  p_source text,
  p_user_id uuid default null,
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns public.inventory_movements
language plpgsql
as $$
declare
  v_product public.products%rowtype;
  v_new_quantity integer;
  v_movement public.inventory_movements;
begin
  if p_change_quantity = 0 then
    raise exception 'p_change_quantity cannot be zero.';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found for id %', p_product_id;
  end if;

  v_new_quantity := v_product.stock_quantity + p_change_quantity;

  if v_new_quantity < 0 then
    raise exception 'Stock cannot go below zero for product %', p_product_id;
  end if;

  insert into public.inventory_movements (
    product_id,
    previous_quantity,
    change_quantity,
    new_quantity,
    reason,
    source,
    user_id,
    reference_type,
    reference_id
  )
  values (
    p_product_id,
    v_product.stock_quantity,
    p_change_quantity,
    v_new_quantity,
    p_reason,
    p_source,
    p_user_id,
    p_reference_type,
    p_reference_id
  )
  returning * into v_movement;

  perform set_config('app.allow_stock_update', 'on', true);

  update public.products
  set stock_quantity = v_new_quantity
  where id = p_product_id;

  return v_movement;
end;
$$;

alter function public.record_inventory_movement(
  uuid,
  integer,
  text,
  text,
  uuid,
  text,
  uuid
) set search_path = public;

-- Row level security is enabled; starter policies are added in a later migration.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.woo_connections enable row level security;
alter table public.sync_logs enable row level security;
