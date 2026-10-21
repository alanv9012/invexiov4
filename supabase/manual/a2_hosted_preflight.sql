-- Invexio A2 hosted-development preflight (READ ONLY).
-- Paste into the Supabase SQL Editor before applying A2. The script returns
-- aggregate identity data and catalog metadata only: no UUIDs, email addresses,
-- credentials, connection values, or WooCommerce data are selected.

begin transaction read only;

-- 1. Decision summary. Resolve every FAIL before applying A2. WARN identifies
-- expected A1-era access that A2 will remove and must still be reviewed.
with required_table(name) as (
  values ('profiles'), ('products'), ('inventory_movements'), ('orders'),
         ('order_items'), ('woo_connections'), ('sync_logs')
), required_function(signature) as (
  values
    ('public.is_active_user()'),
    ('public.effective_role()'),
    ('public.has_permission(text)'),
    ('public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)')
), expected_a1_policy(schemaname, tablename, policyname) as (
  values
    ('public','profiles','profiles_select_own'),
    ('public','profiles','profiles_insert_own'),
    ('public','profiles','profiles_update_own'),
    ('public','products','products_select_authenticated'),
    ('public','inventory_movements','inventory_movements_select_authenticated'),
    ('public','orders','orders_select_authenticated'),
    ('public','orders','orders_insert_authenticated'),
    ('public','orders','orders_delete_authenticated'),
    ('public','order_items','order_items_select_authenticated'),
    ('public','order_items','order_items_insert_authenticated'),
    ('public','woo_connections','woo_connections_select_authenticated'),
    ('public','sync_logs','sync_logs_select_authenticated')
), checks(section, check_name, status, detail) as (
  select 'identity', 'exactly one active Owner',
    case when count(*) filter (where role = 'owner' and is_active) = 1 then 'PASS' else 'FAIL' end,
    format('active_owner_count=%s; total_profiles=%s',
      count(*) filter (where role = 'owner' and is_active), count(*))
  from public.profiles

  union all
  select 'identity', 'all Auth users have profiles',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('missing_profile_count=%s', count(*))
  from auth.users as auth_user
  left join public.profiles as profile on profile.id = auth_user.id
  where profile.id is null

  union all
  select 'identity', 'profile roles are recognized',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('unrecognized_role_count=%s', count(*))
  from public.profiles
  where role not in ('owner', 'manager', 'staff')

  union all
  select 'schema', 'all A2 tables exist',
    case when count(*) filter (where to_regclass('public.' || name) is null) = 0 then 'PASS' else 'FAIL' end,
    format('missing_count=%s', count(*) filter (where to_regclass('public.' || name) is null))
  from required_table

  union all
  select 'schema', 'customer_phone column exists',
    case when exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_phone'
    ) then 'PASS' else 'FAIL' end,
    'public.orders.customer_phone is required by manual sales'

  union all
  select 'schema', 'all protected tables have RLS enabled',
    case when count(*) filter (where not coalesce(class.relrowsecurity, false)) = 0 then 'PASS' else 'FAIL' end,
    format('RLS-disabled table count=%s',
      count(*) filter (where not coalesce(class.relrowsecurity, false)))
  from required_table
  left join pg_catalog.pg_class as class
    on class.oid = to_regclass('public.' || required_table.name)

  union all
  select 'functions', 'A1 functions and inventory RPC exist',
    case when count(*) filter (where to_regprocedure(signature) is null) = 0 then 'PASS' else 'FAIL' end,
    format('missing_function_count=%s', count(*) filter (where to_regprocedure(signature) is null))
  from required_function

  union all
  select 'functions', 'A1 helpers are hardened SECURITY DEFINER functions',
    case when count(*) = 3
           and bool_and(proc.prosecdef)
           and bool_and(owner.rolname = 'postgres')
           and bool_and(coalesce(proc.proconfig @> array['search_path=""'], false))
         then 'PASS' else 'FAIL' end,
    format('matching_hardened_helper_count=%s', count(*))
  from pg_catalog.pg_proc as proc
  join pg_catalog.pg_namespace as namespace on namespace.oid = proc.pronamespace
  join pg_catalog.pg_roles as owner on owner.oid = proc.proowner
  where namespace.nspname = 'public'
    and proc.oid in (
      to_regprocedure('public.is_active_user()'),
      to_regprocedure('public.effective_role()'),
      to_regprocedure('public.has_permission(text)')
    )

  union all
  select 'functions', 'anonymous cannot execute A1 helpers or inventory RPC',
    case when count(*) filter (
      where coalesce(has_function_privilege('anon', to_regprocedure(signature), 'EXECUTE'), false)
    ) = 0 then 'PASS' else 'FAIL' end,
    format('anon-executable function count=%s', count(*) filter (
      where coalesce(has_function_privilege('anon', to_regprocedure(signature), 'EXECUTE'), false)
    ))
  from required_function

  union all
  select 'policies', 'exact A1 policy/table pairs are deployed',
    case when count(*) filter (where deployed.policyname is not null) = count(*)
           and (select count(*) from pg_catalog.pg_policies
                where schemaname = 'public'
                  and tablename in (
                    'profiles','products','inventory_movements','orders','order_items',
                    'woo_connections','sync_logs'
                  )) = count(*)
         then 'PASS' else 'FAIL' end,
    format('expected_present=%s of %s; deployed_protected_policy_count=%s',
      count(*) filter (where deployed.policyname is not null),
      count(*),
      (select count(*) from pg_catalog.pg_policies
       where schemaname = 'public'
         and tablename in (
           'profiles','products','inventory_movements','orders','order_items',
           'woo_connections','sync_logs'
         )))
  from expected_a1_policy
  left join pg_catalog.pg_policies as deployed
    on deployed.schemaname = expected_a1_policy.schemaname
   and deployed.tablename = expected_a1_policy.tablename
   and deployed.policyname = expected_a1_policy.policyname

  union all
  select 'functions', 'authenticated can execute A1 helpers and inventory RPC',
    case when count(*) filter (
      where coalesce(has_function_privilege('authenticated', to_regprocedure(signature), 'EXECUTE'), false)
    ) = count(*) then 'PASS' else 'FAIL' end,
    format('authenticated-executable=%s of %s', count(*) filter (
      where coalesce(has_function_privilege('authenticated', to_regprocedure(signature), 'EXECUTE'), false)
    ), count(*))
  from required_function

  union all
  select 'roles', 'API roles have no inherited memberships',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('membership_count=%s', count(*))
  from pg_catalog.pg_auth_members as membership
  join pg_catalog.pg_roles as member on member.oid = membership.member
  where member.rolname in ('anon', 'authenticated')

  union all
  select 'roles', 'API roles have no elevated attributes',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('elevated_role_count=%s', count(*))
  from pg_catalog.pg_roles
  where rolname in ('anon', 'authenticated')
    and (rolsuper or rolinherit = false or rolcreaterole or rolcreatedb or rolreplication or rolbypassrls)

  union all
  select 'deployment', 'A2 objects are not already deployed',
    case when to_regprocedure('public.can_delete_manual_order(uuid)') is null
           and not exists (
             select 1 from pg_catalog.pg_policies
             where schemaname = 'public' and policyname like 'a2\_%' escape '\'
           )
           and not exists (
             select 1 from pg_catalog.pg_trigger
             where not tgisinternal and tgname in ('guard_manual_order_item_insert', 'guard_manual_order_delete')
           )
         then 'PASS' else 'FAIL' end,
    'A2 helper, a2_* policies, and A2 guard triggers must all be absent before first deployment'

  union all
  select 'deployment', 'migration-history relation state',
    'INFO',
    case when to_regclass('supabase_migrations.schema_migrations') is null
      then 'supabase_migrations.schema_migrations is absent; use the reviewed SQL Editor transaction'
      else 'supabase_migrations.schema_migrations exists; reconcile history before choosing a deployment method'
    end

  union all
  select 'data', 'no duplicate product lines within an order',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('duplicate order/product group count=%s', count(*))
  from (
    select order_id, product_id
    from public.order_items
    where product_id is not null
    group by order_id, product_id
    having count(*) > 1
  ) as duplicate_item

  union all
  select 'data', 'manual deductions reference valid manual order items',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('invalid manual deduction count=%s', count(*))
  from public.inventory_movements as movement
  left join public.orders as order_row
    on order_row.id = movement.reference_id and order_row.source = 'manual'
  left join public.order_items as item
    on item.order_id = order_row.id
   and item.product_id = movement.product_id
   and item.quantity = -movement.change_quantity
   and item.sku = (select product.sku from public.products as product where product.id = movement.product_id)
  where movement.reference_type = 'manual_order'
    and (movement.change_quantity >= 0 or order_row.id is null or item.id is null)

  union all
  select 'data', 'manual deduction ledger has no duplicates',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('duplicate deduction group count=%s', count(*))
  from (
    select reference_id, product_id
    from public.inventory_movements
    where reference_type = 'manual_order'
    group by reference_id, product_id
    having count(*) > 1
  ) as duplicate_deduction

  union all
  select 'data', 'manual rollback ledger has no duplicates',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    format('duplicate rollback group count=%s', count(*))
  from (
    select reference_id, product_id
    from public.inventory_movements
    where reference_type = 'manual_order_rollback'
    group by reference_id, product_id
    having count(*) > 1
  ) as duplicate_rollback
)
select section, check_name, status, detail
from checks
order by case status when 'FAIL' then 1 when 'WARN' then 2 when 'INFO' then 3 else 4 end,
         section, check_name;

-- 2. Aggregate profile state. No identity fields are returned.
select role, is_active, count(*) as profile_count
from public.profiles
group by role, is_active
order by role, is_active desc;

-- 3. Function definitions, ownership, hardening, and effective execution.
with inspected_function(signature) as (
  values
    ('public.is_active_user()'),
    ('public.effective_role()'),
    ('public.has_permission(text)'),
    ('public.record_inventory_movement(uuid,integer,text,text,uuid,text,uuid)')
)
select inspected_function.signature,
       owner.rolname as owner,
       proc.prosecdef as security_definer,
       proc.provolatile as volatility,
       proc.proconfig as function_config,
       coalesce(has_function_privilege('anon', proc.oid, 'EXECUTE'), false) as anon_execute,
       coalesce(has_function_privilege('authenticated', proc.oid, 'EXECUTE'), false) as authenticated_execute,
       coalesce(has_function_privilege('service_role', proc.oid, 'EXECUTE'), false) as service_role_execute,
       pg_catalog.pg_get_functiondef(proc.oid) as definition
from inspected_function
left join pg_catalog.pg_proc as proc on proc.oid = to_regprocedure(inspected_function.signature)
left join pg_catalog.pg_roles as owner on owner.oid = proc.proowner
order by inspected_function.signature;

-- 4. Current policies. FAIL means the policy is not one of the expected A1
-- policy/table pairs; definitions remain visible for manual comparison.
with expected(schemaname, tablename, policyname) as (
  values
    ('public','profiles','profiles_select_own'),
    ('public','profiles','profiles_insert_own'),
    ('public','profiles','profiles_update_own'),
    ('public','products','products_select_authenticated'),
    ('public','inventory_movements','inventory_movements_select_authenticated'),
    ('public','orders','orders_select_authenticated'),
    ('public','orders','orders_insert_authenticated'),
    ('public','orders','orders_delete_authenticated'),
    ('public','order_items','order_items_select_authenticated'),
    ('public','order_items','order_items_insert_authenticated'),
    ('public','woo_connections','woo_connections_select_authenticated'),
    ('public','sync_logs','sync_logs_select_authenticated')
)
select policy.schemaname, policy.tablename, policy.policyname,
       case when expected.policyname is null then 'FAIL' else 'PASS' end as status,
       policy.permissive, policy.roles, policy.cmd, policy.qual, policy.with_check
from pg_catalog.pg_policies as policy
left join expected
  on expected.schemaname = policy.schemaname
 and expected.tablename = policy.tablename
 and expected.policyname = policy.policyname
where policy.schemaname = 'public'
  and policy.tablename in (
    'profiles','products','inventory_movements','orders','order_items','woo_connections','sync_logs'
  )
order by policy.tablename, policy.policyname;

-- 5. Effective table privileges, including inherited and PUBLIC grants.
with protected_table(name) as (
  values ('profiles'), ('products'), ('inventory_movements'), ('orders'),
         ('order_items'), ('woo_connections'), ('sync_logs')
), api_role(name) as (
  values ('anon'), ('authenticated'), ('service_role')
), privilege(name) as (
  select unnest(
    array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']::text[]
    || case when current_setting('server_version_num')::integer >= 170000
            then array['MAINTAIN']::text[]
            else array[]::text[]
       end
  )
)
select api_role.name as role_name,
       'public.' || protected_table.name as relation,
       privilege.name as privilege,
       case
         when api_role.name = 'anon' and effective.allowed then 'FAIL'
         when api_role.name = 'authenticated'
           and privilege.name in ('TRUNCATE','REFERENCES','TRIGGER','MAINTAIN')
           and effective.allowed then 'FAIL'
         when api_role.name = 'authenticated' and effective.allowed then 'WARN'
         else 'INFO'
       end as status,
       effective.allowed
from protected_table
cross join api_role
cross join privilege
cross join lateral (
  select coalesce(has_table_privilege(
    api_role.name,
    to_regclass('public.' || protected_table.name),
    privilege.name
  ), false) as allowed
) as effective
order by api_role.name, protected_table.name, privilege.name;

-- 6. Effective column privileges. This includes access inherited from a table
-- grant. Anonymous access and authorization-column updates are failures.
with api_role(name) as (values ('anon'), ('authenticated'), ('service_role')),
privilege(name) as (values ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES'))
select api_role.name as role_name,
       columns.table_schema || '.' || columns.table_name as relation,
       columns.column_name,
       privilege.name as privilege,
       case
         when api_role.name = 'anon' then 'FAIL'
         when api_role.name = 'authenticated'
           and columns.table_name = 'profiles'
           and columns.column_name in ('id','role','is_active','created_at','updated_at')
           and privilege.name in ('INSERT','UPDATE') then 'FAIL'
         else 'INFO'
       end as status
from information_schema.columns as columns
cross join api_role
cross join privilege
where columns.table_schema = 'public'
  and columns.table_name in (
    'profiles','products','inventory_movements','orders','order_items','woo_connections','sync_logs'
  )
  and has_column_privilege(
    api_role.name,
    format('%I.%I', columns.table_schema, columns.table_name),
    columns.column_name,
    privilege.name
  )
order by api_role.name, columns.table_name, columns.ordinal_position, privilege.name;

-- 7. Role attributes and all direct memberships for API roles.
select rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb,
       rolcanlogin, rolreplication, rolbypassrls
from pg_catalog.pg_roles
where rolname in ('anon', 'authenticated', 'service_role')
order by rolname;

select member.rolname as member_role,
       parent.rolname as inherited_role,
       membership.admin_option,
       case when member.rolname in ('anon', 'authenticated') then 'FAIL' else 'INFO' end as status
from pg_catalog.pg_auth_members as membership
join pg_catalog.pg_roles as member on member.oid = membership.member
join pg_catalog.pg_roles as parent on parent.oid = membership.roleid
where member.rolname in ('anon', 'authenticated', 'service_role')
order by member.rolname, parent.rolname;

-- 8. Relevant constraints and triggers, including the deployed RPC guards.
select namespace.nspname as schema_name,
       class.relname as table_name,
       constraint_row.conname as constraint_name,
       constraint_row.contype,
       pg_catalog.pg_get_constraintdef(constraint_row.oid, true) as definition
from pg_catalog.pg_constraint as constraint_row
join pg_catalog.pg_class as class on class.oid = constraint_row.conrelid
join pg_catalog.pg_namespace as namespace on namespace.oid = class.relnamespace
where namespace.nspname = 'public'
  and class.relname in ('profiles','products','inventory_movements','orders','order_items')
order by class.relname, constraint_row.conname;

select namespace.nspname as schema_name,
       class.relname as table_name,
       trigger_row.tgname as trigger_name,
       pg_catalog.pg_get_triggerdef(trigger_row.oid, true) as definition
from pg_catalog.pg_trigger as trigger_row
join pg_catalog.pg_class as class on class.oid = trigger_row.tgrelid
join pg_catalog.pg_namespace as namespace on namespace.oid = class.relnamespace
where namespace.nspname = 'public'
  and class.relname in ('profiles','products','inventory_movements','orders','order_items')
  and not trigger_row.tgisinternal
order by class.relname, trigger_row.tgname;

-- 9. Migration-history presence only. No history rows are selected.
select current_database() as database_name,
       case when to_regclass('supabase_migrations.schema_migrations') is null
         then 'ABSENT'
         else 'PRESENT'
       end as migration_history_relation;

rollback;
