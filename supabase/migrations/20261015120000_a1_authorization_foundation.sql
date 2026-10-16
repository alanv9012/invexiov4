-- Step A1: authorization helpers and least-privilege grants.
--
-- This migration intentionally does not change existing RLS policies. The
-- manual-order policies and authenticated inventory RPC access remain in place
-- until the transactional Phase B cutover.

begin;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.is_active
      and profile.role in ('owner', 'manager', 'staff')
  );
$$;

alter function public.is_active_user() owner to postgres;
revoke all on function public.is_active_user() from public, anon;
grant execute on function public.is_active_user() to authenticated, service_role;

comment on function public.is_active_user() is
  'Returns true only when auth.uid() has an active Invexio profile with a recognized role.';

create or replace function public.effective_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case profile.role
    when 'owner' then 'owner'
    when 'manager' then 'staff'
    when 'staff' then 'staff'
    else null
  end
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.is_active
  limit 1;
$$;

alter function public.effective_role() owner to postgres;
revoke all on function public.effective_role() from public, anon;
grant execute on function public.effective_role() to authenticated, service_role;

comment on function public.effective_role() is
  'Returns owner or staff for the active caller; legacy manager profiles receive staff permissions.';

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    case public.effective_role()
      when 'owner' then p_permission = any (array[
        'products.read',
        'inventory.read',
        'orders.read',
        'orders.create_manual',
        'profile.update_self',
        'inventory_movements.read',
        'inventory.adjust',
        'products.price.update',
        'orders.completed.manage',
        'users.manage',
        'integrations.manage',
        'sync.run',
        'reports.financial.read'
      ]::text[])
      when 'staff' then p_permission = any (array[
        'products.read',
        'inventory.read',
        'orders.read',
        'orders.create_manual',
        'profile.update_self'
      ]::text[])
      else false
    end,
    false
  );
$$;

alter function public.has_permission(text) owner to postgres;
revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated, service_role;

comment on function public.has_permission(text) is
  'Checks a named Invexio permission using the active caller profile and effective role.';

-- Profiles are created and administered only through privileged invitation and
-- user-management workflows. Authenticated users may edit their own display
-- name through the existing own-row RLS policy, but cannot create a profile or
-- modify identity, role, activation, or audit columns directly.
revoke insert, update on table public.profiles from public, anon, authenticated;
revoke insert (id, full_name, role, is_active, created_at, updated_at)
  on table public.profiles from public, anon, authenticated;
revoke update (id, full_name, role, is_active, created_at, updated_at)
  on table public.profiles from public, anon, authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- Anonymous inventory execution is never required. Authenticated execution is
-- retained temporarily because createManualOrderAction depends on this RPC
-- until Phase B replaces the multi-step order workflow with one transaction.
revoke execute on function public.record_inventory_movement(
  uuid,
  integer,
  text,
  text,
  uuid,
  text,
  uuid
) from public, anon;

grant execute on function public.record_inventory_movement(
  uuid,
  integer,
  text,
  text,
  uuid,
  text,
  uuid
) to authenticated, service_role;

-- Validate effective privileges, including privileges inherited through role
-- membership. Any unexpected inherited access aborts and rolls back A1.
do $$
begin
  if has_function_privilege('anon', 'public.is_active_user()', 'EXECUTE') then
    raise exception 'anon still has effective EXECUTE on public.is_active_user()';
  end if;

  if has_function_privilege('anon', 'public.effective_role()', 'EXECUTE') then
    raise exception 'anon still has effective EXECUTE on public.effective_role()';
  end if;

  if has_function_privilege('anon', 'public.has_permission(text)', 'EXECUTE') then
    raise exception 'anon still has effective EXECUTE on public.has_permission(text)';
  end if;

  if has_function_privilege(
    'anon',
    'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'anon still has effective EXECUTE on public.record_inventory_movement()';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated lost EXECUTE on public.record_inventory_movement()';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'service_role lost EXECUTE on public.record_inventory_movement()';
  end if;

  if has_table_privilege('authenticated', 'public.profiles', 'INSERT') then
    raise exception 'authenticated still has effective INSERT on public.profiles';
  end if;

  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')
     or has_column_privilege('authenticated', 'public.profiles', 'is_active', 'UPDATE') then
    raise exception 'authenticated still has effective UPDATE on profile authorization columns';
  end if;

  if not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') then
    raise exception 'authenticated cannot UPDATE public.profiles.full_name';
  end if;
end;
$$;

commit;
