-- Step A1 owner bootstrap template.
--
-- Run this separately from reusable migrations and only after verifying the
-- exact Auth UUID with a read-only query. This template fails closed while the
-- value below is empty. Never commit a real Auth UUID to this file.

begin;

select pg_advisory_xact_lock(hashtextextended('invexio:a1:owner-bootstrap', 0));

do $bootstrap$
declare
  -- Set this only in the reviewed execution copy used in Supabase SQL Editor.
  v_owner_id_text constant text := '';
  v_owner_id uuid;
  v_role text;
  v_is_active boolean;
  v_updated integer;
begin
  if btrim(v_owner_id_text) = '' then
    raise exception 'Set v_owner_id_text to the verified Auth UUID before executing';
  end if;

  begin
    v_owner_id := v_owner_id_text::uuid;
  exception
    when invalid_text_representation then
      raise exception 'The supplied owner identity is not a valid UUID';
  end;

  if (select count(*) from auth.users where id = v_owner_id) <> 1 then
    raise exception 'The verified owner Auth user was not found';
  end if;

  select profile.role, profile.is_active
  into v_role, v_is_active
  from public.profiles as profile
  where profile.id = v_owner_id
  for update;

  if not found then
    raise exception 'The verified owner does not have a profile';
  end if;

  if not v_is_active then
    raise exception 'The verified owner profile is inactive';
  end if;

  if v_role <> 'staff' then
    raise exception 'Expected the verified owner profile to have role staff, found %', v_role;
  end if;

  if exists (
    select 1
    from public.profiles as profile
    where profile.role = 'owner'
      and profile.id <> v_owner_id
  ) then
    raise exception 'A different owner profile already exists';
  end if;

  update public.profiles
  set role = 'owner'
  where id = v_owner_id
    and role = 'staff'
    and is_active;

  get diagnostics v_updated = row_count;

  if v_updated <> 1 then
    raise exception 'Owner bootstrap did not update exactly one profile';
  end if;
end;
$bootstrap$;

commit;
