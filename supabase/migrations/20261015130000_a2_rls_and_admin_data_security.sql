-- Step A2: active-user RLS, explicit API grants, and administrative data security.
--
-- The authenticated manual-order INSERT/DELETE and inventory RPC grants remain
-- temporarily because createManualOrderAction still performs compensating
-- operations across multiple database transactions. Phase B will replace that
-- workflow with one atomic database function and remove those direct grants.

begin;

-- Preserve the deployed signature used by manual sales, Owner adjustments, and
-- service-role WooCommerce synchronization while authorizing each authenticated
-- movement from server-established identity and database relationships.
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
security definer
set search_path = ''
as $$
declare
  v_auth_uid uuid := (select auth.uid());
  v_is_service_role boolean := coalesce((select auth.role()) = 'service_role', false);
  v_product public.products%rowtype;
  v_order public.orders%rowtype;
  v_item_count integer;
  v_item_quantity integer;
  v_new_quantity integer;
  v_original_movement public.inventory_movements%rowtype;
  v_movement public.inventory_movements;
begin
  if p_change_quantity = 0 then
    raise exception 'p_change_quantity cannot be zero.';
  end if;

  if nullif(pg_catalog.btrim(p_reason), '') is null then
    raise exception 'p_reason is required.';
  end if;

  if not v_is_service_role then
    if v_auth_uid is null or not public.is_active_user() then
      raise exception using
        errcode = '42501',
        message = 'An active authenticated profile is required for inventory movements.';
    end if;

    if p_user_id is distinct from v_auth_uid then
      raise exception using
        errcode = '42501',
        message = 'Inventory movement user does not match the authenticated user.';
    end if;
  end if;

  -- All manual-sale operations lock the order BEFORE any product. Updating
  -- the row also makes stale REPEATABLE READ transactions fail serialization
  -- rather than validate items/ledger against an old snapshot after waiting.
  if p_reference_type in ('manual_order', 'manual_order_rollback') then
    update public.orders as order_row
    set updated_at = pg_catalog.clock_timestamp()
    where order_row.id = p_reference_id
      and order_row.source = 'manual'
      and order_row.status = 'processing'
      and (v_is_service_role or order_row.created_by = v_auth_uid)
      and order_row.woo_order_id is null
      and order_row.last_synced_at is null
    returning order_row.* into v_order;

    if not found then
      raise exception using errcode = '42501',
        message = 'Manual inventory movement requires a caller-owned processing order.';
    end if;
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found for id %', p_product_id;
  end if;

  if not v_is_service_role then
    case p_reference_type
      when 'manual_adjustment' then
        if not public.has_permission('inventory.adjust')
           or p_source <> 'manual'
           or p_reference_id is not null then
          raise exception using
            errcode = '42501',
            message = 'Manual inventory adjustments require Owner permission.';
        end if;

      when 'manual_order' then
        if not public.has_permission('orders.create_manual')
           or p_source <> 'manual'
           or p_change_quantity >= 0
           or p_reference_id is null
           or v_product.status <> 'active' then
          raise exception using
            errcode = '42501',
            message = 'Invalid manual-order inventory deduction.';
        end if;

        select count(*)::integer, coalesce(sum(item.quantity), 0)::integer
        into v_item_count, v_item_quantity
        from public.order_items as item
        where item.order_id = v_order.id
          and item.product_id = p_product_id;

        if v_item_count <> 1 or v_item_quantity <> -p_change_quantity then
          raise exception using
            errcode = '42501',
            message = 'Manual-order inventory quantity does not match its order item.';
        end if;

        if exists (
          select 1
          from public.inventory_movements as movement
          where movement.reference_type = 'manual_order'
            and movement.reference_id = v_order.id
            and movement.product_id = p_product_id
        ) then
          raise exception using
            errcode = '42501',
            message = 'Inventory was already deducted for this manual-order item.';
        end if;

      when 'manual_order_rollback' then
        if not public.has_permission('orders.create_manual')
           or p_source <> 'system'
           or p_change_quantity <= 0
           or p_reference_id is null then
          raise exception using
            errcode = '42501',
            message = 'Invalid manual-order inventory rollback.';
        end if;

        select count(*)::integer, coalesce(sum(item.quantity), 0)::integer
        into v_item_count, v_item_quantity
        from public.order_items as item
        where item.order_id = v_order.id
          and item.product_id = p_product_id;

        if v_item_count <> 1 or v_item_quantity <> p_change_quantity then
          raise exception using
            errcode = '42501',
            message = 'Manual-order rollback quantity does not match its order item.';
        end if;

        select movement.*
        into v_original_movement
        from public.inventory_movements as movement
        where movement.reference_type = 'manual_order'
          and movement.reference_id = v_order.id
          and movement.product_id = p_product_id
          and movement.user_id = v_auth_uid
          and movement.source = 'manual'
          and movement.change_quantity = -p_change_quantity
        order by movement.created_at
        limit 1
        for update;

        if not found then
          raise exception using
            errcode = '42501',
            message = 'No matching manual-order inventory deduction exists to roll back.';
        end if;

        if exists (
          select 1
          from public.inventory_movements as movement
          where movement.reference_type = 'manual_order_rollback'
            and movement.reference_id = v_order.id
            and movement.product_id = p_product_id
            and movement.user_id = v_auth_uid
        ) then
          raise exception using
            errcode = '42501',
            message = 'Inventory was already restored for this manual-order item.';
        end if;

      else
        raise exception using
          errcode = '42501',
          message = 'Authenticated users cannot create this inventory movement type.';
    end case;
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

  perform pg_catalog.set_config('app.allow_stock_update', 'on', true);

  update public.products
  set stock_quantity = v_new_quantity
  where id = p_product_id;

  return v_movement;
end;
$$;

alter function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid)
  owner to postgres;

revoke all on function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid)
  from public, anon;
grant execute on function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid)
  to authenticated, service_role;

comment on function public.record_inventory_movement(uuid, integer, text, text, uuid, text, uuid) is
  'Records a locked stock delta. Authenticated calls are limited to authorized Owner adjustments or validated manual-order deductions and exact rollbacks.';

-- The DELETE policy uses this definer helper so its movement-ledger checks are
-- not hidden by the Owner-only inventory_movements SELECT policy.
create or replace function public.can_delete_manual_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_active_user()
    and (
      public.has_permission('orders.completed.manage')
      or (
        public.has_permission('orders.create_manual')
        and exists (
          select 1
          from public.orders as order_row
          where order_row.id = p_order_id
            and order_row.source = 'manual'
            and order_row.status = 'processing'
            and order_row.created_by = (select auth.uid())
            and order_row.woo_order_id is null
            and order_row.last_synced_at is null
        )
        and not exists (
          select 1 from public.inventory_movements as movement
          where movement.reference_type in ('manual_order', 'manual_order_rollback')
            and movement.reference_id = p_order_id
          group by movement.product_id, movement.user_id
          having sum(movement.change_quantity) <> 0
        )
      )
    );
$$;

alter function public.can_delete_manual_order(uuid) owner to postgres;
revoke all on function public.can_delete_manual_order(uuid) from public, anon;
grant execute on function public.can_delete_manual_order(uuid) to authenticated, service_role;

comment on function public.can_delete_manual_order(uuid) is
  'Allows Owner order management or deletion of a caller-owned manual order only when no stock deduction remains unmatched.';

-- RLS is an early authorization filter, NOT the concurrency barrier. These
-- VOLATILE triggers take/reuse the order lock and read a fresh ledger snapshot.
create or replace function public.guard_manual_order_item_insert()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  -- Touch the parent before FK/product locks, including for privileged callers.
  update public.orders as order_row
  set updated_at = pg_catalog.clock_timestamp()
  where order_row.id = new.order_id and order_row.source = 'manual';

  if found then
    if exists (
      select 1 from public.inventory_movements as movement
      where movement.reference_id = new.order_id
        and movement.reference_type in ('manual_order', 'manual_order_rollback')
    ) then
      raise exception using errcode = '42501',
        message = 'Manual order items are frozen once inventory processing begins.';
    end if;

    if exists (
      select 1 from public.order_items as item
      where item.order_id = new.order_id and item.product_id = new.product_id
    ) then
      raise exception using errcode = '42501',
        message = 'A manual order may contain only one item per product.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_manual_order_delete()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  -- DELETE has already locked OLD. Explicitly retain that lock before the
  -- separate ledger query; do not call the STABLE policy helper here.
  perform 1 from public.orders where id = old.id for update;

  if exists (
    select 1 from public.inventory_movements as movement
    where movement.reference_id = old.id
      and movement.reference_type in ('manual_order', 'manual_order_rollback')
    group by movement.product_id, movement.user_id
    having sum(movement.change_quantity) <> 0
  ) then
    raise exception using errcode = '42501',
      message = 'Order deletion requires all manual stock deductions to be restored.';
  end if;
  return old;
end;
$$;

alter function public.guard_manual_order_item_insert() owner to postgres;
alter function public.guard_manual_order_delete() owner to postgres;
revoke all on function public.guard_manual_order_item_insert() from public, anon, authenticated, service_role;
revoke all on function public.guard_manual_order_delete() from public, anon, authenticated, service_role;

drop trigger if exists guard_manual_order_item_insert on public.order_items;
create trigger guard_manual_order_item_insert
before insert on public.order_items
for each row execute function public.guard_manual_order_item_insert();

drop trigger if exists guard_manual_order_delete on public.orders;
create trigger guard_manual_order_delete
before delete on public.orders
for each row execute function public.guard_manual_order_delete();

-- Trigger functions are not public RPCs.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.prevent_direct_stock_update() from public, anon, authenticated;

-- Reset API-role table privileges before granting the exact A2 surface.
revoke all privileges on table
  public.profiles,
  public.products,
  public.inventory_movements,
  public.orders,
  public.order_items,
  public.woo_connections,
  public.sync_logs
from public, anon, authenticated;

-- A1 granted this column privilege separately from the table-level grant.
revoke update (full_name) on table public.profiles from public, anon, authenticated;

grant select on table
  public.profiles,
  public.products,
  public.inventory_movements,
  public.orders,
  public.order_items,
  public.woo_connections,
  public.sync_logs
to authenticated;

grant update (full_name) on table public.profiles to authenticated;

grant insert (
  order_number,
  status,
  currency,
  total_amount,
  customer_name,
  customer_email,
  customer_phone,
  source,
  notes,
  created_by,
  ordered_at
) on table public.orders to authenticated;

grant delete on table public.orders to authenticated;

grant insert (
  order_id,
  product_id,
  sku,
  product_name,
  quantity,
  unit_price,
  line_total
) on table public.order_items to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.products,
  public.inventory_movements,
  public.orders,
  public.order_items,
  public.woo_connections,
  public.sync_logs
to service_role;

-- Replace every starter policy. The final assertion below rejects unexpected
-- extra policies that could combine permissively with this set.
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

drop policy if exists a2_profiles_select on public.profiles;
drop policy if exists a2_profiles_update_self on public.profiles;
drop policy if exists a2_products_select on public.products;
drop policy if exists a2_inventory_movements_select on public.inventory_movements;
drop policy if exists a2_orders_select on public.orders;
drop policy if exists a2_orders_insert_manual on public.orders;
drop policy if exists a2_orders_delete_rollback on public.orders;
drop policy if exists a2_order_items_select on public.order_items;
drop policy if exists a2_order_items_insert_manual on public.order_items;
drop policy if exists a2_woo_connections_select on public.woo_connections;
drop policy if exists a2_sync_logs_select on public.sync_logs;

create policy a2_profiles_select
  on public.profiles
  for select
  to authenticated
  using (
    public.is_active_user()
    and (
      id = (select auth.uid())
      or public.has_permission('users.manage')
    )
  );

create policy a2_profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (
    public.is_active_user()
    and public.has_permission('profile.update_self')
    and id = (select auth.uid())
  )
  with check (
    public.is_active_user()
    and public.has_permission('profile.update_self')
    and id = (select auth.uid())
  );

create policy a2_products_select
  on public.products
  for select
  to authenticated
  using (
    public.is_active_user()
    and public.has_permission('products.read')
  );

create policy a2_inventory_movements_select
  on public.inventory_movements
  for select
  to authenticated
  using (
    public.is_active_user()
    and public.has_permission('inventory_movements.read')
  );

create policy a2_orders_select
  on public.orders
  for select
  to authenticated
  using (
    public.is_active_user()
    and public.has_permission('orders.read')
  );

create policy a2_orders_insert_manual
  on public.orders
  for insert
  to authenticated
  with check (
    public.is_active_user()
    and public.has_permission('orders.create_manual')
    and source = 'manual'
    and status = 'processing'
    and currency = 'USD'
    and order_number like 'MAN-%'
    and created_by = (select auth.uid())
    and woo_order_id is null
    and last_synced_at is null
  );

create policy a2_orders_delete_rollback
  on public.orders
  for delete
  to authenticated
  using (public.can_delete_manual_order(id));

create policy a2_order_items_select
  on public.order_items
  for select
  to authenticated
  using (
    public.is_active_user()
    and public.has_permission('orders.read')
  );

create policy a2_order_items_insert_manual
  on public.order_items
  for insert
  to authenticated
  with check (
    public.is_active_user()
    and public.has_permission('orders.create_manual')
    and product_id is not null
    and line_total = unit_price * quantity
    and exists (
      select 1
      from public.orders as order_row
      where order_row.id = order_items.order_id
        and order_row.source = 'manual'
        and order_row.status = 'processing'
        and order_row.created_by = (select auth.uid())
        and order_row.woo_order_id is null
        and order_row.last_synced_at is null
    )
    and exists (
      select 1
      from public.products as product
      where product.id = order_items.product_id
        and product.status = 'active'
        and product.sku = order_items.sku
        and product.name = order_items.product_name
        and product.price = order_items.unit_price
    )
  );

create policy a2_woo_connections_select
  on public.woo_connections
  for select
  to authenticated
  using (
    public.is_active_user()
    and public.has_permission('integrations.manage')
  );

create policy a2_sync_logs_select
  on public.sync_logs
  for select
  to authenticated
  using (
    public.is_active_user()
    and public.has_permission('sync.run')
  );

-- Abort the transaction if inherited privileges or unexpected policies widen
-- the intended A2 API surface.
do $$
declare
  v_unexpected_policy text;
  v_role text;
  v_table text;
  v_column text;
  v_privilege text;
  v_allowed boolean;
  v_memberships text;
  v_function text;
begin
  -- Fail closed on unexpected memberships, including NOINHERIT/SET paths.
  -- Supabase API roles need no parent roles for this application.
  for v_role in select unnest(array['anon', 'authenticated']) loop
    if exists (
      select 1 from pg_catalog.pg_roles as role_row
      where role_row.rolname = v_role
        and (role_row.rolsuper or role_row.rolbypassrls or role_row.rolcreaterole)
    ) then
      raise exception 'Unexpected elevated role attributes for %', v_role;
    end if;
    select pg_catalog.string_agg(role_row.rolname, ', ' order by role_row.rolname)
    into v_memberships
    from pg_catalog.pg_roles as role_row
    where role_row.rolname <> v_role
      and pg_catalog.pg_has_role(v_role, role_row.oid, 'MEMBER');
    if v_memberships is not null then
      raise exception 'Unexpected role memberships for %: %', v_role, v_memberships;
    end if;

    for v_table in select unnest(array[
      'profiles', 'products', 'inventory_movements', 'orders',
      'order_items', 'woo_connections', 'sync_logs'
    ]) loop
      if not (select relrowsecurity and not relforcerowsecurity
              from pg_catalog.pg_class where oid = ('public.' || v_table)::regclass) then
        raise exception 'Unexpected RLS configuration on %', v_table;
      end if;
      for v_privilege in select unnest(array[
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
      ] || case when current_setting('server_version_num')::integer >= 170000
                then array['MAINTAIN']::text[] else array[]::text[] end) loop
        v_allowed := v_role = 'authenticated' and (
          v_privilege = 'SELECT' or (v_table = 'orders' and v_privilege = 'DELETE')
        );
        if pg_catalog.has_table_privilege(v_role, 'public.' || v_table, v_privilege)
           is distinct from v_allowed
           or pg_catalog.has_table_privilege(v_role, 'public.' || v_table, v_privilege || ' WITH GRANT OPTION') then
          raise exception 'Unexpected effective % privilege on % for %', v_privilege, v_table, v_role;
        end if;
      end loop;

      for v_column in
        select attname from pg_catalog.pg_attribute
        where attrelid = ('public.' || v_table)::regclass and attnum > 0 and not attisdropped
      loop
        for v_privilege in select unnest(array['SELECT', 'INSERT', 'UPDATE', 'REFERENCES']) loop
          v_allowed := v_role = 'authenticated' and (
            v_privilege = 'SELECT'
            or (v_table = 'profiles' and v_column = 'full_name' and v_privilege = 'UPDATE')
            or (v_table = 'orders' and v_privilege = 'INSERT' and v_column = any(array[
              'order_number', 'status', 'currency', 'total_amount', 'customer_name',
              'customer_email', 'customer_phone', 'source', 'notes', 'created_by', 'ordered_at'
            ]))
            or (v_table = 'order_items' and v_privilege = 'INSERT' and v_column = any(array[
              'order_id', 'product_id', 'sku', 'product_name', 'quantity', 'unit_price', 'line_total'
            ]))
          );
          if pg_catalog.has_column_privilege(v_role, 'public.' || v_table, v_column, v_privilege)
             is distinct from v_allowed
             or pg_catalog.has_column_privilege(v_role, 'public.' || v_table, v_column, v_privilege || ' WITH GRANT OPTION') then
            raise exception 'Unexpected effective % privilege on %.% for %', v_privilege, v_table, v_column, v_role;
          end if;
        end loop;
      end loop;
    end loop;
  end loop;

  for v_function in select unnest(array[
    'public.is_active_user()', 'public.effective_role()', 'public.has_permission(text)',
    'public.can_delete_manual_order(uuid)',
    'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)'
  ]) loop
    if pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
       or not pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
       or pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE WITH GRANT OPTION')
       or not pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE') then
      raise exception 'Unexpected effective function privileges on %', v_function;
    end if;
  end loop;
  for v_function in select unnest(array[
    'public.set_updated_at()', 'public.prevent_direct_stock_update()',
    'public.guard_manual_order_item_insert()', 'public.guard_manual_order_delete()'
  ]) loop
    if pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
       or pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'API role can execute trigger function %', v_function;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)', 'EXECUTE') then
    raise exception 'inventory RPC execution privileges do not match A2';
  end if;

  if has_function_privilege('anon', 'public.can_delete_manual_order(uuid)', 'EXECUTE') then
    raise exception 'anon can execute public.can_delete_manual_order(uuid)';
  end if;

  select pg_catalog.string_agg(
    pg_catalog.format('%I.%I.%I', policy.schemaname, policy.tablename, policy.policyname),
    ', '
    order by policy.schemaname, policy.tablename, policy.policyname
  )
  into v_unexpected_policy
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename in (
      'profiles',
      'products',
      'inventory_movements',
      'orders',
      'order_items',
      'woo_connections',
      'sync_logs'
    )
    and not exists (
      select 1
      from (values
        ('public', 'profiles', 'a2_profiles_select'),
        ('public', 'profiles', 'a2_profiles_update_self'),
        ('public', 'products', 'a2_products_select'),
        ('public', 'inventory_movements', 'a2_inventory_movements_select'),
        ('public', 'orders', 'a2_orders_select'),
        ('public', 'orders', 'a2_orders_insert_manual'),
        ('public', 'orders', 'a2_orders_delete_rollback'),
        ('public', 'order_items', 'a2_order_items_select'),
        ('public', 'order_items', 'a2_order_items_insert_manual'),
        ('public', 'woo_connections', 'a2_woo_connections_select'),
        ('public', 'sync_logs', 'a2_sync_logs_select')
      ) as allowed_policy(schemaname, tablename, policyname)
      where allowed_policy.schemaname = policy.schemaname
        and allowed_policy.tablename = policy.tablename
        and allowed_policy.policyname = policy.policyname
    );

  if v_unexpected_policy is not null then
    raise exception 'unexpected RLS policies remain after A2: %', v_unexpected_policy;
  end if;
end;
$$;

commit;
