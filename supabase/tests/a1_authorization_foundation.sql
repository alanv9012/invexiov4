-- Step A1 database authorization tests.
--
-- Run only after applying migrations to a disposable Supabase test database.
-- The fixture and all assertions execute in a transaction that is rolled back.

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
    raise exception 'A1 assertion failed: % (expected %, received %)',
      p_message,
      p_expected,
      coalesce(p_actual, '<null>');
  end if;
end;
$$;

-- These test-only helpers are SECURITY INVOKER so their SQL runs with the
-- explicitly selected anon/authenticated role and is subject to normal grants
-- and RLS. They exist only inside this transaction and are removed by rollback.
create function public.a1_test_assert_staff_profile_permissions(
  p_owner_id uuid,
  p_staff_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if current_user <> 'authenticated' then
    raise exception 'Profile-operation test must run as authenticated';
  end if;

  if (select auth.uid()) is distinct from p_staff_id then
    raise exception 'Profile-operation test JWT does not identify the staff fixture';
  end if;

  with updated as (
    update public.profiles
    set full_name = 'A1 Staff Updated'
    where id = p_staff_id
    returning id
  )
  select count(*) into v_updated from updated;

  if v_updated <> 1 then
    raise exception 'Staff could not update their own full_name';
  end if;

  begin
    update public.profiles
    set role = 'owner'
    where id = p_staff_id;

    raise exception 'Staff unexpectedly updated their role';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    update public.profiles
    set is_active = false
    where id = p_staff_id;

    raise exception 'Staff unexpectedly updated their activation status';
  exception
    when insufficient_privilege then
      null;
  end;

  with updated as (
    update public.profiles
    set full_name = 'Unauthorized Owner Update'
    where id = p_owner_id
    returning id
  )
  select count(*) into v_updated from updated;

  if v_updated <> 0 then
    raise exception 'Staff unexpectedly updated another user profile';
  end if;
end;
$$;

revoke all on function public.a1_test_assert_staff_profile_permissions(uuid, uuid)
  from public, anon;
grant execute on function public.a1_test_assert_staff_profile_permissions(uuid, uuid)
  to authenticated;

create function public.a1_test_assert_missing_profile_insert_denied(p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    raise exception 'Missing-profile test must run as authenticated';
  end if;

  if (select auth.uid()) is distinct from p_user_id then
    raise exception 'Missing-profile test JWT does not identify the expected fixture';
  end if;

  begin
    insert into public.profiles (id, full_name, role, is_active)
    values (p_user_id, 'Unauthorized Profile', 'owner', true);

    raise exception 'A user without a profile unexpectedly inserted one';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

revoke all on function public.a1_test_assert_missing_profile_insert_denied(uuid)
  from public, anon;
grant execute on function public.a1_test_assert_missing_profile_insert_denied(uuid)
  to authenticated;

create function public.a1_test_assert_anonymous_execution_denied()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'anon' then
    raise exception 'Anonymous execution test must run as anon';
  end if;

  begin
    perform public.is_active_user();
    raise exception 'Anonymous caller unexpectedly executed public.is_active_user()';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.effective_role();
    raise exception 'Anonymous caller unexpectedly executed public.effective_role()';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.has_permission('products.read');
    raise exception 'Anonymous caller unexpectedly executed public.has_permission(text)';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    perform public.record_inventory_movement(
      null::uuid,
      0,
      'A1 anonymous execution test',
      'manual',
      null::uuid,
      null::text,
      null::uuid
    );
    raise exception 'Anonymous caller unexpectedly executed public.record_inventory_movement()';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

revoke all on function public.a1_test_assert_anonymous_execution_denied()
  from public, authenticated;
grant execute on function public.a1_test_assert_anonymous_execution_denied()
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
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a1-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'a1-staff@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'a1-manager@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'a1-inactive@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'a1-missing-profile@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.profiles (id, full_name, role, is_active)
values
  ('a1000000-0000-0000-0000-000000000001', 'A1 Owner', 'owner', true),
  ('a1000000-0000-0000-0000-000000000002', 'A1 Staff', 'staff', true),
  ('a1000000-0000-0000-0000-000000000003', 'A1 Legacy Manager', 'manager', true),
  ('a1000000-0000-0000-0000-000000000004', 'A1 Inactive', 'staff', false);

set local role authenticated;

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.assert_equal(public.is_active_user()::text, 'true', 'owner is active');
select pg_temp.assert_equal(public.effective_role(), 'owner', 'owner effective role');
select pg_temp.assert_equal(public.has_permission('orders.create_manual')::text, 'true', 'owner can create manual sales');
select pg_temp.assert_equal(public.has_permission('users.manage')::text, 'true', 'owner can manage users');
select pg_temp.assert_equal(public.has_permission('unknown.permission')::text, 'false', 'unknown permission fails closed');

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000002', true);
select pg_temp.assert_equal(public.is_active_user()::text, 'true', 'staff is active');
select pg_temp.assert_equal(public.effective_role(), 'staff', 'staff effective role');
select pg_temp.assert_equal(public.has_permission('orders.create_manual')::text, 'true', 'staff can create manual sales');
select pg_temp.assert_equal(public.has_permission('inventory.adjust')::text, 'false', 'staff cannot adjust inventory');
select pg_temp.assert_equal(public.has_permission('reports.financial.read')::text, 'false', 'staff cannot read financial reports');
select public.a1_test_assert_staff_profile_permissions(
  'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002'
);
select pg_temp.assert_equal(
  (select full_name from public.profiles where id = 'a1000000-0000-0000-0000-000000000002'),
  'A1 Staff Updated',
  'staff full_name update is visible through own-row RLS'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000003', true);
select pg_temp.assert_equal(public.is_active_user()::text, 'true', 'legacy manager is active');
select pg_temp.assert_equal(public.effective_role(), 'staff', 'legacy manager maps to staff');
select pg_temp.assert_equal(public.has_permission('orders.create_manual')::text, 'true', 'legacy manager retains staff workflow');
select pg_temp.assert_equal(public.has_permission('inventory.adjust')::text, 'false', 'legacy manager has no owner inventory permission');

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000004', true);
select pg_temp.assert_equal(public.is_active_user()::text, 'false', 'inactive user is rejected');
select pg_temp.assert_equal(public.effective_role(), null, 'inactive user has no effective role');
select pg_temp.assert_equal(public.has_permission('orders.create_manual')::text, 'false', 'inactive user has no permissions');

select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000005', true);
select pg_temp.assert_equal(public.is_active_user()::text, 'false', 'missing profile is rejected');
select pg_temp.assert_equal(public.effective_role(), null, 'missing profile has no effective role');
select pg_temp.assert_equal(public.has_permission('orders.create_manual')::text, 'false', 'missing profile has no permissions');
select public.a1_test_assert_missing_profile_insert_denied(
  'a1000000-0000-0000-0000-000000000005'
);

reset role;

select pg_temp.assert_equal(
  (select full_name from public.profiles where id = 'a1000000-0000-0000-0000-000000000001'),
  'A1 Owner',
  'staff could not modify the owner profile'
);
select pg_temp.assert_equal(
  (select count(*)::text from public.profiles where id = 'a1000000-0000-0000-0000-000000000005'),
  '0',
  'missing-profile user could not insert a profile'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;
select public.a1_test_assert_anonymous_execution_denied();
reset role;

select pg_temp.assert_equal(
  has_function_privilege('anon', 'public.is_active_user()', 'EXECUTE')::text,
  'false',
  'anonymous cannot execute active-user helper'
);
select pg_temp.assert_equal(
  has_function_privilege('anon', 'public.effective_role()', 'EXECUTE')::text,
  'false',
  'anonymous cannot execute effective-role helper'
);
select pg_temp.assert_equal(
  has_function_privilege('anon', 'public.has_permission(text)', 'EXECUTE')::text,
  'false',
  'anonymous cannot execute permission helper'
);
select pg_temp.assert_equal(
  has_function_privilege('anon', 'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)', 'EXECUTE')::text,
  'false',
  'anonymous cannot execute inventory RPC'
);
select pg_temp.assert_equal(
  has_function_privilege('authenticated', 'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)', 'EXECUTE')::text,
  'true',
  'authenticated retains inventory RPC execution for Phase B compatibility'
);
select pg_temp.assert_equal(
  has_table_privilege('authenticated', 'public.profiles', 'INSERT')::text,
  'false',
  'authenticated cannot insert profiles'
);
select pg_temp.assert_equal(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')::text,
  'true',
  'authenticated can update full_name'
);
select pg_temp.assert_equal(
  has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')::text,
  'false',
  'authenticated cannot update role'
);
select pg_temp.assert_equal(
  has_column_privilege('authenticated', 'public.profiles', 'is_active', 'UPDATE')::text,
  'false',
  'authenticated cannot update activation'
);

rollback;
