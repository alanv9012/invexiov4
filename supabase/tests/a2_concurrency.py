#!/usr/bin/env python3
"""Destructive ONLY to its fixtures in an EMPTY disposable local Supabase DB.
Run: python3 supabase/tests/a2_concurrency.py --port 55322 --disposable-local
Uses stdlib + psql. Never reads .env, a project link, or hosted credentials.
Concurrent fixtures must commit to be visible across sessions; finally cleans
only this run's UUIDs. Destroy the scratch stack if the runner is interrupted.
"""
import argparse
import os
import queue
import subprocess
import threading
import time
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, required=True)
parser.add_argument('--disposable-local', action='store_true', required=True)
args = parser.parse_args()
if not 1024 <= args.port <= 65535:
    parser.error('Expected an explicit non-system local port')
ENV = {'PATH': os.environ['PATH'], 'PGPASSWORD': 'postgres', 'LC_ALL': 'C'}
CMD = ['psql', '-X', '-h', '127.0.0.1', '-p', str(args.port), '-U', 'postgres',
       '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose']

def sql(statement):
    result = subprocess.run(CMD, input=statement, text=True, capture_output=True, env=ENV, timeout=20)
    if result.returncode:
        raise AssertionError(result.stderr)
    return result.stdout.strip()

class Session:
    def __init__(self, name):
        self.name = name
        self.lines = queue.Queue()
        self.process = subprocess.Popen(CMD, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, text=True, bufsize=1,
                                        env={**ENV, 'PGAPPNAME': name})
        def read():
            for line in self.process.stdout:
                self.lines.put(line)
            self.lines.put(None)
        self.reader = threading.Thread(target=read, daemon=True)
        self.reader.start()

    def send(self, statement):
        marker = 'done_' + uuid.uuid4().hex
        self.process.stdin.write(statement + '\n\\echo ' + marker + '\n')
        self.process.stdin.flush()
        return marker

    def finish(self, marker, error=None):
        output = ''
        while True:
            line = self.lines.get(timeout=20)
            if line is None:
                if error and error in output:
                    return output
                raise AssertionError(output)
            if line.strip() == marker:
                if error:
                    raise AssertionError('Expected SQLSTATE ' + error + ': ' + output)
                return output
            output += line

    def run(self, statement, error=None):
        return self.finish(self.send(statement), error)

    def close(self):
        if self.process.poll() is None:
            self.process.stdin.close()  # psql EOF rolls back any unfinished transaction
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.terminate()
                self.process.wait(timeout=5)
        self.process.stdout.close()
        self.reader.join(timeout=2)

staff, staff_two, owner = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
products, orders = [], []

def auth(user=staff, isolation='read committed'):
    return f"begin isolation level {isolation}; set local statement_timeout='15s'; set local role authenticated; select set_config('request.jwt.claim.sub','{user}',true); select set_config('request.jwt.claim.role','authenticated',true);"

def request(statement, error=None, user=staff):
    session = Session('a2_request_' + uuid.uuid4().hex)
    try:
        return session.run(auth(user) + statement + '; commit;', error)
    finally:
        session.close()

def fixture(items=True, second_stock=10, created_by=staff):
    order, p1, p2 = [str(uuid.uuid4()) for _ in range(3)]
    products.extend([p1, p2]); orders.append(order)
    sql(f"""begin;
      insert into public.products(id,sku,name,price,stock_quantity) values
        ('{p1}','{p1}','Fixture',10,10), ('{p2}','{p2}','Fixture',10,{second_stock});
      insert into public.orders(id,order_number,status,total_amount,source,created_by)
        values ('{order}','MAN-{order}','processing',20,'manual','{created_by}');
      commit;""")
    if items:
        request(item(order, p1), user=created_by)
    return order, p1, p2

def item(order, product):
    return f"insert into public.order_items(order_id,product_id,sku,product_name,quantity,unit_price,line_total) values ('{order}','{product}','{product}','Fixture',1,10,10)"

def movement(order, product, rollback=False, user=staff):
    delta, source, reference = (1, 'system', 'manual_order_rollback') if rollback else (-1, 'manual', 'manual_order')
    return f"select public.record_inventory_movement('{product}',{delta},'A2 test','{source}','{user}','{reference}','{order}')"

def delete(order):
    return f"delete from public.orders where id='{order}' returning id"

def check(query, expected):
    actual = sql(query)
    assert actual == str(expected), (query, actual, expected)

def race(first, second, expected_error='42501', first_user=staff, second_user=staff):
    a = Session('a2_lock_holder_' + uuid.uuid4().hex)
    b = Session('a2_lock_waiter_' + uuid.uuid4().hex)
    try:
        a.run(auth(first_user) + first + ';')
        marker = b.send(auth(second_user) + second + '; commit;')
        deadline = time.monotonic() + 8
        blocking_query = f"""select count(*)
          from pg_stat_activity as waiter
          join pg_stat_activity as blocker
            on blocker.pid = any(pg_blocking_pids(waiter.pid))
          where waiter.application_name='{b.name}'
            and blocker.application_name='{a.name}'
            and waiter.wait_event_type='Lock'"""
        while sql(blocking_query) != '1':
            if b.process.poll() is not None or time.monotonic() > deadline:
                raise AssertionError('Second session did not block on the first session lock')
            time.sleep(0.05)
        a.run('commit;')
        b.finish(marker, expected_error)
    finally:
        a.close(); b.close()

# Refuse a nonempty DB before committing any fixtures.
for table in ['auth.users', 'public.profiles', 'public.orders', 'public.products', 'public.inventory_movements']:
    check(f'select count(*) from {table}', 0)
check("select count(*) from pg_trigger where tgname='guard_manual_order_delete' and not tgisinternal", 1)
try:
    sql(f"""begin;
      insert into auth.users(id,email) values
        ('{staff}','a2-concurrency-staff@example.invalid'),
        ('{staff_two}','a2-concurrency-staff-two@example.invalid'),
        ('{owner}','a2-concurrency-owner@example.invalid');
      insert into public.profiles(id,role,is_active) values
        ('{staff}','staff',true),
        ('{staff_two}','staff',true),
        ('{owner}','owner',true);
      commit;""")

    o,p,q = fixture()
    race(movement(o,p), delete(o))
    check(f"select stock_quantity from products where id='{p}'",9)
    check(f"select count(*) from orders where id='{o}'",1)
    print('PASS deduction versus staff deletion: delete waits, then rejects')

    o,p,q = fixture()
    race(movement(o,p), delete(o), second_user=owner)
    check(f"select count(*) from orders where id='{o}'",1)
    print('PASS deduction versus Owner deletion: trigger also protects recovery records')

    o,p,q = fixture()
    race(delete(o), movement(o,p))
    check(f"select stock_quantity from products where id='{p}'",10)
    check(f"select count(*) from inventory_movements where reference_id='{o}'",0)
    print('PASS deletion wins: waiting deduction rejects the missing order')

    o,p,q = fixture()
    race(movement(o,p), movement(o,p))
    check(f"select count(*) from inventory_movements where reference_id='{o}'",1)
    check(f"select stock_quantity from products where id='{p}'",9)
    print('PASS simultaneous deductions: exactly one deduction')

    # Two independent manual orders and identities compete for the final unit.
    # Each transaction locks its own order first, then both serialize on the
    # same product row. The second transaction must observe the committed zero.
    shared_product, first_order, second_order = [str(uuid.uuid4()) for _ in range(3)]
    products.append(shared_product); orders.extend([first_order, second_order])
    sql(f"""begin;
      insert into public.products(id,sku,name,price,stock_quantity)
        values ('{shared_product}','{shared_product}','Fixture',10,1);
      insert into public.orders(id,order_number,status,total_amount,source,created_by) values
        ('{first_order}','MAN-{first_order}','processing',10,'manual','{staff}'),
        ('{second_order}','MAN-{second_order}','processing',10,'manual','{staff_two}');
      commit;""")
    request(item(first_order, shared_product), user=staff)
    request(item(second_order, shared_product), user=staff_two)
    race(
        movement(first_order, shared_product, user=staff),
        movement(second_order, shared_product, user=staff_two),
        expected_error='P0001',
        first_user=staff,
        second_user=staff_two
    )
    check(f"select stock_quantity from products where id='{shared_product}'",0)
    check(f"select count(*) from inventory_movements where product_id='{shared_product}'",1)
    check(f"select count(*) from inventory_movements where reference_id='{first_order}'",1)
    check(f"select count(*) from inventory_movements where reference_id='{second_order}'",0)
    check(f"select count(*) from orders where id in ('{first_order}','{second_order}')",2)
    print('PASS different orders compete for final unit: real product lock wait, one deduction only')

    race(movement(o,p,True), movement(o,p,True))
    check(f"select stock_quantity from products where id='{p}'",10)
    print('PASS simultaneous rollback credits: exactly one restoration')

    o,p,q = fixture()
    race(movement(o,p), item(o,q))
    check(f"select count(*) from order_items where order_id='{o}'",1)
    print('PASS deduction versus item append: insertion waits, then rejects')

    o,p,q = fixture(items=False)
    race(item(o,p), movement(o,p), expected_error=None)
    check(f"select stock_quantity from products where id='{p}'",9)
    print('PASS insertion wins: waiting deduction sees the committed item')

    o,p,q = fixture(items=False)
    race(item(o,p), item(o,p))
    check(f"select count(*) from order_items where order_id='{o}'",1)
    print('PASS concurrent duplicate item insertion: exactly one item')

    # A stale repeatable-read snapshot must not validate old ledger state.
    o,p,q = fixture()
    b=Session('a2_repeatable_read')
    try:
        b.run(auth(isolation='repeatable read') + f"select count(*) from orders where id='{o}';")
        request(movement(o,p))
        b.run(item(o,q)+';', error='40001')
    finally:
        b.close()
    print('PASS stale repeatable-read insertion fails serialization')
    o,p,q = fixture()
    b=Session('a2_repeatable_delete')
    try:
        b.run(auth(isolation='repeatable read') + f"select count(*) from orders where id='{o}';")
        request(movement(o,p))
        b.run(delete(o)+';', error='40001')
    finally:
        b.close()
    check(f"select count(*) from orders where id='{o}'",1)
    print('PASS stale repeatable-read deletion fails serialization')


    o,p,q = fixture(second_stock=0)
    request(item(o,q))
    request(movement(o,p))
    request(movement(o,q), error='P0001')
    request(movement(o,p,True))
    request(delete(o))
    check(f"select stock_quantity from products where id='{p}'",10)
    check(f"select count(*) from orders where id='{o}'",0)
    print('PASS multi-product partial failure: exact compensation then cleanup')

    o,p,q = fixture()
    request(movement(o,p))
    sql(f"update profiles set is_active=false where id='{staff}'")
    request(movement(o,p,True), error='42501')
    request(delete(o))  # RLS returns DELETE 0, not an exception.
    check(f"select count(*) from orders where id='{o}'",1)
    check(f"select stock_quantity from products where id='{p}'",9)
    sql(f"update profiles set is_active=true where id='{staff}'")
    print('PASS failed compensation: order and deduction retained for recovery')

    o,p,q = fixture()
    request(movement(o,p))  # Commit succeeded; caller deliberately ignores result.
    request(movement(o,p), error='42501')
    request(delete(o))
    check(f"select count(*) from orders where id='{o}'",1)
    check(f"select stock_quantity from products where id='{p}'",9)
    request(movement(o,p,True))  # Also model losing the rollback response.
    request(movement(o,p,True), error='42501')
    check(f"select stock_quantity from products where id='{p}'",10)
    request(delete(o))
    print('PASS committed-but-unobserved RPC results: retries cannot double-deduct/credit')
finally:
    # Only fixtures from this run; never TRUNCATE or reset a database here.
    ids=','.join("'"+i+"'" for i in orders) or 'null'
    pids=','.join("'"+i+"'" for i in products) or 'null'
    sql(f"""begin;
      delete from inventory_movements where reference_id in ({ids});
      delete from orders where id in ({ids});
      delete from products where id in ({pids});
      delete from profiles where id in ('{staff}','{staff_two}','{owner}');
      delete from auth.users where id in ('{staff}','{staff_two}','{owner}');
      commit;""")
    for table in ['auth.users','public.profiles','public.orders','public.order_items','public.products','public.inventory_movements']:
        check(f'select count(*) from {table}',0)
    print('PASS all committed concurrency fixtures cleaned up')
