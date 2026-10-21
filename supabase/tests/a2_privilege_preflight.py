#!/usr/bin/env python3
"""Local-only negative migration tests. Every injected object/grant rolls back.
python3 supabase/tests/a2_privilege_preflight.py --port 55322 --disposable-local
Run against an already-migrated disposable DB. No hosted links or credentials.
"""
import argparse
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, required=True)
parser.add_argument('--disposable-local', action='store_true', required=True)
args = parser.parse_args()
if not 1024 <= args.port <= 65535:
    parser.error('Expected an explicit non-system local port')
command = ['psql', '-X', '-h', '127.0.0.1', '-p', str(args.port), '-U', 'postgres',
           '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1']
env = {'PATH': os.environ['PATH'], 'PGPASSWORD': 'postgres', 'LC_ALL': 'C'}

def run(text):
    return subprocess.run(command, input=text, text=True, capture_output=True, env=env, timeout=20)

migration = (Path(__file__).resolve().parents[1] / 'migrations/20261015130000_a2_rls_and_admin_data_security.sql').read_text()
assert migration.endswith('commit;\n')
# Execute the actual migration with rollback instead of commit and inject
# forbidden effective grants just before its final assertion block. This proves
# assertions (not just REVOKE statements) reject access. Production SQL unchanged.
rollback_migration = migration[:-len('commit;\n')] + 'rollback;\n'
marker = '-- Abort the transaction if inherited privileges or unexpected policies widen'
assert marker in migration
cases = [
    ('inherited TRUNCATE', 'create role a2_test_parent nologin; grant truncate on public.orders to a2_test_parent; grant a2_test_parent to authenticated;', 'Unexpected role memberships'),
    ('NOINHERIT SET path', 'create role a2_test_parent nologin; grant a2_test_parent to authenticated with inherit false;', 'Unexpected role memberships'),
    ('TRUNCATE', 'grant truncate on public.orders to authenticated;', 'Unexpected effective TRUNCATE'),
    ('prohibited INSERT column', 'grant insert(woo_order_id) on public.orders to authenticated;', 'Unexpected effective INSERT'),
    ('prohibited UPDATE column', 'grant update(role) on public.profiles to authenticated;', 'Unexpected effective UPDATE'),
    ('anonymous column access', 'grant select(customer_email) on public.orders to anon;', 'Unexpected effective SELECT'),
    ('PUBLIC privilege', 'grant select on public.orders to public;', 'Unexpected effective SELECT'),
    ('grant option', 'grant select on public.orders to authenticated with grant option;', 'Unexpected effective SELECT'),
    (
        'allowed policy name on wrong table',
        'create policy a2_orders_select on public.profiles for select to authenticated using (true);',
        'unexpected RLS policies remain after A2: public.profiles.a2_orders_select'
    )
]
check=run("select count(*) from auth.users; select count(*) from pg_roles where rolname='a2_test_parent';")
assert check.returncode == 0 and check.stdout.strip() == '0\n0', 'Requires an empty disposable DB and unused test role'
version=run("show server_version_num;")
assert version.returncode == 0, version.stderr
supports_maintain=int(version.stdout.strip()) >= 170000
if supports_maintain:
    # Inject after A2's REVOKE/GRANT block so this cannot pass merely because
    # REVOKE ALL correctly removes a pre-existing direct grant.
    cases.append((
        'MAINTAIN after privilege reset',
        'grant maintain on public.orders to authenticated;',
        'Unexpected effective MAINTAIN privilege on orders for authenticated'
    ))
for name, injection, expected in cases:
    result=run(rollback_migration.replace(marker, injection+'\n'+marker,1))
    assert result.returncode != 0 and expected in result.stderr, (name,result.stdout,result.stderr)
    cleanup_checks = "select count(*) from pg_roles where rolname='a2_test_parent'; select has_table_privilege('authenticated','public.orders','TRUNCATE'); select has_column_privilege('authenticated','public.orders','woo_order_id','INSERT');"
    expected_cleanup = '0\nf\nf'
    if supports_maintain:
        cleanup_checks += " select has_table_privilege('authenticated','public.orders','MAINTAIN');"
        expected_cleanup += '\nf'
    check=run(cleanup_checks)
    assert check.returncode == 0 and check.stdout.strip() == expected_cleanup, check.stdout
    print('PASS migration fails closed and rolls back: '+name)
result=run(rollback_migration)
assert result.returncode == 0, result.stderr
print('PASS unmodified migration assertions accept expected local grants/memberships')
