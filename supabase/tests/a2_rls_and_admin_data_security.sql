-- Step A2 database authorization and inventory RPC tests.
--
-- Run only after all migrations have been applied to a disposable local
-- Supabase database. Every fixture and helper is rolled back.

begin;

create or replace function pg_temp.assert_equal(
  p_actual text,
  p_expected text,
  p_message text
)
returns void
language plpgsql
as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'A2 assertion failed: % (expected %, received %)',
      p_message,
      coalesce(p_expected, '<null>'),
      coalesce(p_actual, '<null>');
  end if;
end;
$$;

create function public.a2_test_expect_insufficient_privilege(
  p_sql text,
  p_message text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  begin
    execute p_sql;
  exception
    when insufficient_privilege then
      return;
  end;

  raise exception 'A2 assertion failed: % did not raise insufficient_privilege', p_message;
end;
$$;

revoke all on function public.a2_test_expect_insufficient_privilege(text, text)
  from public, anon;
grant execute on function public.a2_test_expect_insufficient_privilege(text, text)
  to authenticated;

create function public.a2_test_assert_anonymous_denied()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'anon' then
    raise exception 'Anonymous test must run as anon';
  end if;

  begin
    perform count(*) from public.products;
    raise exception 'A2 assertion failed: anonymous caller read products';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform count(*) from public.orders;
    raise exception 'A2 assertion failed: anonymous caller read orders';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.is_active_user();
    raise exception 'A2 assertion failed: anonymous caller executed is_active_user()';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.record_inventory_movement(
      'b2000000-0000-0000-0000-000000000001',
      1,
      'Anonymous forged adjustment',
      'manual',
      null,
      'manual_adjustment',
      null
    );
    raise exception 'A2 assertion failed: anonymous caller executed inventory RPC';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

revoke all on function public.a2_test_assert_anonymous_denied()
  from public, authenticated;
grant execute on function public.a2_test_assert_anonymous_denied()
  to anon;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a2-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'a2-staff@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'a2-manager@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'a2-inactive@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'a2-missing-profile@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.profiles (id, full_name, role, is_active)
values
  ('a2000000-0000-0000-0000-000000000001', 'A2 Owner', 'owner', true),
  ('a2000000-0000-0000-0000-000000000002', 'A2 Staff', 'staff', true),
  ('a2000000-0000-0000-0000-000000000003', 'A2 Legacy Manager', 'manager', true),
  ('a2000000-0000-0000-0000-000000000004', 'A2 Inactive', 'staff', false);

insert into public.products (
  id,
  sku,
  name,
  price,
  stock_quantity,
  manage_stock,
  status
)
values
  ('b2000000-0000-0000-0000-000000000001', 'A2-SKU-1', 'A2 Product One', 12.50, 20, true, 'active'),
  ('b2000000-0000-0000-0000-000000000002', 'A2-SKU-2', 'A2 Product Two', 8.00, 15, true, 'active');

insert into public.orders (
  id,
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
)
values (
  'c2000000-0000-0000-0000-000000000001',
  'MAN-A2-OWNER',
  'processing',
  'USD',
  12.50,
  'Owner Customer',
  'owner-customer@example.invalid',
  '+1-555-0100',
  'manual',
  'Delivery at front desk',
  'a2000000-0000-0000-0000-000000000001',
  now()
);

insert into public.order_items (
  order_id,
  product_id,
  sku,
  product_name,
  quantity,
  unit_price,
  line_total
)
values (
  'c2000000-0000-0000-0000-000000000001',
  'b2000000-0000-0000-0000-000000000001',
  'A2-SKU-1',
  'A2 Product One',
  1,
  12.50,
  12.50
);

insert into public.woo_connections (
  id,
  name,
  store_url,
  is_active,
  webhook_secret_hint
)
values (
  'd2000000-0000-0000-0000-000000000001',
  'A2 Store',
  'https://a2.example.invalid',
  true,
  'not-a-secret'
);

insert into public.sync_logs (
  woo_connection_id,
  type,
  status,
  message,
  payload,
  started_at,
  finished_at
)
values (
  'd2000000-0000-0000-0000-000000000001',
  'products',
  'success',
  'A2 fixture sync',
  '{"fixture":true}',
  now(),
  now()
);

-- Owner access and legitimate arbitrary adjustment.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select pg_temp.assert_equal(public.effective_role(), 'owner', 'Owner effective role');
select pg_temp.assert_equal((select count(*)::text from public.profiles), '4', 'Owner reads all profiles');
select pg_temp.assert_equal((select count(*)::text from public.products), '2', 'Owner reads products');
select pg_temp.assert_equal((select count(*)::text from public.orders), '1', 'Owner reads orders');
select pg_temp.assert_equal((select count(*)::text from public.order_items), '1', 'Owner reads order items');
select pg_temp.assert_equal((select count(*)::text from public.woo_connections), '1', 'Owner reads connection metadata');
select pg_temp.assert_equal((select count(*)::text from public.sync_logs), '1', 'Owner reads sync logs');

select public.record_inventory_movement(
  'b2000000-0000-0000-0000-000000000001',
  2,
  'A2 Owner adjustment',
  'manual',
  'a2000000-0000-0000-0000-000000000001',
  'manual_adjustment',
  null
);

select pg_temp.assert_equal(
  (select stock_quantity::text from public.products where id = 'b2000000-0000-0000-0000-000000000001'),
  '22',
  'Owner adjustment changes stock'
);
select pg_temp.assert_equal(
  (select count(*)::text from public.inventory_movements),
  '1',
  'Owner reads inventory movements'
);

-- Staff operational access and administrative denial.
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000002', true);

select pg_temp.assert_equal(public.effective_role(), 'staff', 'Staff effective role');
select pg_temp.assert_equal((select count(*)::text from public.profiles), '1', 'Staff reads only own profile');
select pg_temp.assert_equal((select count(*)::text from public.products), '2', 'Staff reads products and stock');
select pg_temp.assert_equal((select count(*)::text from public.orders), '1', 'Staff reads individual orders');
select pg_temp.assert_equal(
  (select customer_email from public.orders where id = 'c2000000-0000-0000-0000-000000000001'),
  'owner-customer@example.invalid',
  'Staff reads customer contact information'
);
select pg_temp.assert_equal(
  (select total_amount::text from public.orders where id = 'c2000000-0000-0000-0000-000000000001'),
  '12.50',
  'Staff reads individual order totals'
);
select pg_temp.assert_equal((select count(*)::text from public.order_items), '1', 'Staff reads order items');
select pg_temp.assert_equal((select count(*)::text from public.inventory_movements), '0', 'Staff cannot read movement ledger');
select pg_temp.assert_equal((select count(*)::text from public.woo_connections), '0', 'Staff cannot read connection metadata');
select pg_temp.assert_equal((select count(*)::text from public.sync_logs), '0', 'Staff cannot read sync logs');

with updated as (
  update public.profiles
  set full_name = 'A2 Staff Updated'
  where id = 'a2000000-0000-0000-0000-000000000002'
  returning id
)
select pg_temp.assert_equal((select count(*)::text from updated), '1', 'Staff updates own full_name');

with updated as (
  update public.profiles
  set full_name = 'Unauthorized Owner Rename'
  where id = 'a2000000-0000-0000-0000-000000000001'
  returning id
)
select pg_temp.assert_equal((select count(*)::text from updated), '0', 'Staff cannot update another profile');

select public.a2_test_expect_insufficient_privilege(
  $$update public.profiles
    set role = 'owner'
    where id = 'a2000000-0000-0000-0000-000000000002'$$,
  'Staff role update'
);

select public.a2_test_expect_insufficient_privilege(
  $$update public.products
    set price = 1
    where id = 'b2000000-0000-0000-0000-000000000001'$$,
  'Staff price update'
);

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001',
    5,
    'Forged staff adjustment',
    'manual',
    'a2000000-0000-0000-0000-000000000002',
    'manual_adjustment',
    null
  )$$,
  'Staff arbitrary stock adjustment'
);

-- Create the same order and item shape used by createManualOrderAction.
insert into public.orders (
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
)
values (
  'MAN-A2-STAFF-ROLLBACK',
  'processing',
  'USD',
  37.50,
  'Staff Customer',
  'staff-customer@example.invalid',
  '+1-555-0101',
  'manual',
  'A2 staff rollback test',
  'a2000000-0000-0000-0000-000000000002',
  now()
);

insert into public.order_items (
  order_id,
  product_id,
  sku,
  product_name,
  quantity,
  unit_price,
  line_total
)
select
  order_row.id,
  'b2000000-0000-0000-0000-000000000001',
  'A2-SKU-1',
  'A2 Product One',
  3,
  12.50,
  37.50
from public.orders as order_row
where order_row.order_number = 'MAN-A2-STAFF-ROLLBACK';

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001',
    -3,
    'Forged user deduction',
    'manual',
    'a2000000-0000-0000-0000-000000000001',
    'manual_order',
    (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
  )$$,
  'Caller-supplied p_user_id forgery'
);

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001',
    -3,
    'Forged order deduction',
    'manual',
    'a2000000-0000-0000-0000-000000000002',
    'manual_order',
    'c2000000-0000-0000-0000-000000000001'
  )$$,
  'Another user order reference'
);

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001',
    -2,
    'Incorrect quantity deduction',
    'manual',
    'a2000000-0000-0000-0000-000000000002',
    'manual_order',
    (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
  )$$,
  'Incorrect manual-order quantity'
);

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000002',
    -3,
    'Mismatched product deduction',
    'manual',
    'a2000000-0000-0000-0000-000000000002',
    'manual_order',
    (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
  )$$,
  'Product without matching order item'
);

select public.record_inventory_movement(
  'b2000000-0000-0000-0000-000000000001',
  -3,
  'Manual order deduction',
  'manual',
  'a2000000-0000-0000-0000-000000000002',
  'manual_order',
  (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
);

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001',
    -3,
    'Repeated deduction',
    'manual',
    'a2000000-0000-0000-0000-000000000002',
    'manual_order',
    (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
  )$$,
  'Repeated manual-order deduction'
);

with deleted as (
  delete from public.orders
  where order_number = 'MAN-A2-STAFF-ROLLBACK'
  returning id
)
select pg_temp.assert_equal(
  (select count(*)::text from deleted),
  '0',
  'Order with unmatched deduction cannot be deleted'
);

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001',
    2,
    'Incorrect rollback quantity',
    'system',
    'a2000000-0000-0000-0000-000000000002',
    'manual_order_rollback',
    (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
  )$$,
  'Incorrect rollback quantity'
);

select public.record_inventory_movement(
  'b2000000-0000-0000-0000-000000000001',
  3,
  'Exact manual-order rollback',
  'system',
  'a2000000-0000-0000-0000-000000000002',
  'manual_order_rollback',
  (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
);

select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001',
    3,
    'Duplicate rollback credit',
    'system',
    'a2000000-0000-0000-0000-000000000002',
    'manual_order_rollback',
    (select id from public.orders where order_number = 'MAN-A2-STAFF-ROLLBACK')
  )$$,
  'Duplicate rollback credit'
);

with deleted as (
  delete from public.orders
  where order_number = 'MAN-A2-STAFF-ROLLBACK'
  returning id
)
select pg_temp.assert_equal(
  (select count(*)::text from deleted),
  '1',
  'Fully rolled-back manual order can be deleted'
);

select pg_temp.assert_equal(
  (select stock_quantity::text from public.products where id = 'b2000000-0000-0000-0000-000000000001'),
  '22',
  'Manual-order rollback restores exact stock'
);

-- A successful manual sale keeps its order, item, deduction, and actor.
insert into public.orders (
  order_number,
  status,
  currency,
  total_amount,
  customer_name,
  customer_email,
  source,
  created_by,
  ordered_at
)
values (
  'MAN-A2-STAFF-SUCCESS',
  'processing',
  'USD',
  16.00,
  'Completed Staff Customer',
  'completed-staff@example.invalid',
  'manual',
  'a2000000-0000-0000-0000-000000000002',
  now()
);

insert into public.order_items (
  order_id,
  product_id,
  sku,
  product_name,
  quantity,
  unit_price,
  line_total
)
select
  order_row.id,
  'b2000000-0000-0000-0000-000000000002',
  'A2-SKU-2',
  'A2 Product Two',
  2,
  8.00,
  16.00
from public.orders as order_row
where order_row.order_number = 'MAN-A2-STAFF-SUCCESS';

select public.record_inventory_movement(
  'b2000000-0000-0000-0000-000000000002',
  -2,
  'Successful manual sale deduction',
  'manual',
  'a2000000-0000-0000-0000-000000000002',
  'manual_order',
  (select id from public.orders where order_number = 'MAN-A2-STAFF-SUCCESS')
);

select pg_temp.assert_equal(
  (select stock_quantity::text from public.products where id = 'b2000000-0000-0000-0000-000000000002'),
  '13',
  'Successful manual sale deducts stock'
);
select pg_temp.assert_equal(
  (select created_by::text from public.orders where order_number = 'MAN-A2-STAFF-SUCCESS'),
  'a2000000-0000-0000-0000-000000000002',
  'Successful manual sale records its authenticated actor'
);

with deleted as (
  delete from public.orders
  where order_number = 'MAN-A2-STAFF-SUCCESS'
  returning id
)
select pg_temp.assert_equal(
  (select count(*)::text from deleted),
  '0',
  'Successful manual sale with unmatched deduction cannot be deleted'
);

-- Invalid manual-order payloads are blocked by grants and RLS.
select public.a2_test_expect_insufficient_privilege(
  $$insert into public.orders (
    order_number, status, currency, total_amount, source, created_by, ordered_at
  ) values (
    'WOO-FORGED', 'processing', 'USD', 1, 'woocommerce',
    'a2000000-0000-0000-0000-000000000002', now()
  )$$,
  'Staff WooCommerce order insert'
);

select public.a2_test_expect_insufficient_privilege(
  $$insert into public.orders (
    order_number, status, currency, total_amount, source, created_by, ordered_at
  ) values (
    'MAN-FORGED-OWNER', 'processing', 'USD', 1, 'manual',
    'a2000000-0000-0000-0000-000000000001', now()
  )$$,
  'Staff order created for another user'
);

insert into public.orders (
  order_number, status, currency, total_amount, customer_name, source, created_by, ordered_at
)
values (
  'MAN-A2-ITEM-CHECK', 'processing', 'USD', 12.50, 'Item Check',
  'manual', 'a2000000-0000-0000-0000-000000000002', now()
);

select public.a2_test_expect_insufficient_privilege(
  $$insert into public.order_items (
    order_id, product_id, sku, product_name, quantity, unit_price, line_total
  )
  select
    id, 'b2000000-0000-0000-0000-000000000001', 'A2-SKU-1',
    'A2 Product One', 1, 1.00, 1.00
  from public.orders where order_number = 'MAN-A2-ITEM-CHECK'$$,
  'Forged manual-order item price'
);

select public.a2_test_expect_insufficient_privilege(
  $$insert into public.order_items (
    order_id, product_id, sku, product_name, quantity, unit_price, line_total
  ) select id, 'b2000000-0000-0000-0000-000000000001', 'FORGED-SKU',
    'A2 Product One', 1, 12.50, 12.50
    from public.orders where order_number = 'MAN-A2-ITEM-CHECK'$$,
  'Forged manual-order item SKU'
);

-- Both appends and duplicate lines are rejected after a successful deduction.
select public.a2_test_expect_insufficient_privilege(
  $$insert into public.order_items (
    order_id, product_id, sku, product_name, quantity, unit_price, line_total
  ) select id, 'b2000000-0000-0000-0000-000000000001', 'A2-SKU-1',
    'A2 Product One', 1, 12.50, 12.50
    from public.orders where order_number = 'MAN-A2-STAFF-SUCCESS'$$,
  'Append product after inventory processing'
);
select public.a2_test_expect_insufficient_privilege(
  $$insert into public.order_items (
    order_id, product_id, sku, product_name, quantity, unit_price, line_total
  ) select id, 'b2000000-0000-0000-0000-000000000002', 'A2-SKU-2',
    'A2 Product Two', 2, 8.00, 16.00
    from public.orders where order_number = 'MAN-A2-STAFF-SUCCESS'$$,
  'Duplicate product after inventory processing'
);

-- Owner cleanup must retain an order if any deduction is still outstanding.
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000001', true);
select public.a2_test_expect_insufficient_privilege(
  $$delete from public.orders where order_number = 'MAN-A2-STAFF-SUCCESS'$$,
  'Owner cannot delete an order with unrestored stock'
);
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000002', true);

delete from public.orders where order_number = 'MAN-A2-ITEM-CHECK';

with deleted as (
  delete from public.orders
  where id = 'c2000000-0000-0000-0000-000000000001'
  returning id
)
select pg_temp.assert_equal((select count(*)::text from deleted), '0', 'Staff cannot delete another user order');

-- Legacy manager receives exactly staff-equivalent access.
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000003', true);

select pg_temp.assert_equal(public.effective_role(), 'staff', 'Legacy manager maps to staff');
select pg_temp.assert_equal((select count(*)::text from public.products), '2', 'Legacy manager reads products');
select pg_temp.assert_equal((select count(*)::text from public.orders), '2', 'Legacy manager reads orders');
select pg_temp.assert_equal((select count(*)::text from public.woo_connections), '0', 'Legacy manager cannot read integrations');
select pg_temp.assert_equal((select count(*)::text from public.sync_logs), '0', 'Legacy manager cannot read sync logs');
select pg_temp.assert_equal(public.has_permission('inventory.adjust')::text, 'false', 'Legacy manager cannot adjust stock');

insert into public.orders (
  order_number, status, currency, total_amount, customer_name, source, created_by, ordered_at
)
values (
  'MAN-A2-MANAGER', 'processing', 'USD', 0, 'Manager Customer',
  'manual', 'a2000000-0000-0000-0000-000000000003', now()
);
select pg_temp.assert_equal(
  (select count(*)::text from public.orders where order_number = 'MAN-A2-MANAGER'),
  '1',
  'Legacy manager can begin the staff manual-sale workflow'
);
delete from public.orders where order_number = 'MAN-A2-MANAGER';

-- Inactive and missing-profile users are denied at the policy and RPC layers.
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000004', true);
select pg_temp.assert_equal(public.is_active_user()::text, 'false', 'Inactive user rejected');
select pg_temp.assert_equal((select count(*)::text from public.products), '0', 'Inactive user reads no products');
select pg_temp.assert_equal((select count(*)::text from public.orders), '0', 'Inactive user reads no orders');
select public.a2_test_expect_insufficient_privilege(
  $$insert into public.orders (
    order_number, status, currency, total_amount, source, created_by, ordered_at
  ) values (
    'MAN-A2-INACTIVE', 'processing', 'USD', 0, 'manual',
    'a2000000-0000-0000-0000-000000000004', now()
  )$$,
  'Inactive manual-order insert'
);
select public.a2_test_expect_insufficient_privilege(
  $$select public.record_inventory_movement(
    'b2000000-0000-0000-0000-000000000001', 1, 'Inactive adjustment', 'manual',
    'a2000000-0000-0000-0000-000000000004', 'manual_adjustment', null
  )$$,
  'Inactive inventory RPC'
);

select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-000000000005', true);
select pg_temp.assert_equal(public.is_active_user()::text, 'false', 'Missing-profile user rejected');
select pg_temp.assert_equal((select count(*)::text from public.products), '0', 'Missing-profile user reads no products');
select pg_temp.assert_equal((select count(*)::text from public.orders), '0', 'Missing-profile user reads no orders');
select public.a2_test_expect_insufficient_privilege(
  $$insert into public.orders (
    order_number, status, currency, total_amount, source, created_by, ordered_at
  ) values (
    'MAN-A2-MISSING', 'processing', 'USD', 0, 'manual',
    'a2000000-0000-0000-0000-000000000005', now()
  )$$,
  'Missing-profile manual-order insert'
);
select public.a2_test_expect_insufficient_privilege(
  $$insert into public.profiles (id, full_name, role, is_active)
    values ('a2000000-0000-0000-0000-000000000005', 'Forged Owner', 'owner', true)$$,
  'Missing-profile self insert'
);

reset role;

-- Service-role synchronization retains its existing inventory path.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;

select public.record_inventory_movement(
  'b2000000-0000-0000-0000-000000000002',
  4,
  'A2 service-role stock sync',
  'sync',
  null,
  'woo_product_sync',
  null
);

select pg_temp.assert_equal(
  (select stock_quantity::text from public.products where id = 'b2000000-0000-0000-0000-000000000002'),
  '17',
  'Service-role synchronization changes stock'
);

reset role;

-- Actual anonymous execution checks.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;
select public.a2_test_assert_anonymous_denied();
reset role;

-- Effective privilege metadata checks, including inherited privileges.
select pg_temp.assert_equal(
  has_table_privilege('anon', 'public.products', 'SELECT')::text,
  'false',
  'Anonymous has no products SELECT'
);
select pg_temp.assert_equal(
  has_table_privilege('authenticated', 'public.products', 'SELECT')::text,
  'true',
  'Authenticated retains products SELECT'
);
select pg_temp.assert_equal(
  has_table_privilege('authenticated', 'public.orders', 'DELETE')::text,
  'true',
  'Authenticated retains temporary order DELETE'
);
select pg_temp.assert_equal(
  has_column_privilege('authenticated', 'public.orders', 'order_number', 'INSERT')::text,
  'true',
  'Authenticated can insert manual order_number'
);
select pg_temp.assert_equal(
  has_column_privilege('authenticated', 'public.orders', 'woo_order_id', 'INSERT')::text,
  'false',
  'Authenticated cannot insert WooCommerce order identity'
);
select pg_temp.assert_equal(
  has_table_privilege('authenticated', 'public.order_items', 'DELETE')::text,
  'false',
  'Authenticated cannot directly delete order items'
);
select pg_temp.assert_equal(
  has_function_privilege(
    'authenticated',
    'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)',
    'EXECUTE'
  )::text,
  'true',
  'Authenticated retains temporary inventory RPC execution'
);
select pg_temp.assert_equal(
  has_function_privilege(
    'anon',
    'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)',
    'EXECUTE'
  )::text,
  'false',
  'Anonymous cannot execute inventory RPC'
);

rollback;
