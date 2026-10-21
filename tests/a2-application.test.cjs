// Run with node tests/a2-application.test.cjs. Uses installed TypeScript
// to load the real server modules with in-memory dependencies; no .env/network.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, mocks = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'server-only') return {};
      if (name === 'zod') return require('zod');
      throw new Error(`Unexpected dependency: ${name}`);
    },
    console: { error() {} }, FormData, Date, Map, Intl
  }, { filename: path });
  return module.exports;
}
function query(result) {
  const q = {};
  for (const method of ['select','in','gte','lte','lt','eq','order','limit','insert','delete','single','maybeSingle']) {
    q[method] = () => q;
  }
  q.then = (yes, no) => Promise.resolve(result).then(yes, no);
  return q;
}

for (const privileged of [false, true]) {
  test(`dashboard ${privileged ? 'Owner' : 'staff/manager'}: server gates administrative queries`, async () => {
    const queried = [];
    const supabase = { from(table) {
      queried.push(table);
      // Model permissive A1 RLS: an admin query would return sensitive data.
      const rows = table === 'inventory_movements' ? [{
        id: 'movement', change_quantity: 7, reason: 'PRIVATE', source: 'manual',
        created_at: new Date().toISOString(), products: { name: 'Product' }
      }] : table === 'sync_logs' ? [{ type: 'products', status: 'failed' }] : [];
      return query({ data: rows, count: rows.length, error: null });
    }};
    const { getDashboardData } = load('src/features/dashboard/queries.ts', {
      '@/server/auth/authorization': {
        authorizePermission: async () => ({ authorized: true, supabase }),
        contextHasPermission: async () => privileged
      },
      '@/features/dashboard/analytics': load('src/features/dashboard/analytics.ts'),
      '@/lib/ui/tokens': { stockThresholds: { lowStockMax: 5 } }
    });
    const result = await getDashboardData();
    assert.equal(result.errorMessage, null);
    assert.equal(queried.includes('inventory_movements'), privileged);
    assert.equal(queried.includes('sync_logs'), privileged);
    assert.equal(JSON.stringify(result).includes('PRIVATE'), privileged);
    if (!privileged) {
      assert.equal(result.recentMovements.length, 0);
      assert.equal(result.activityFeed.length, 0);
      assert.equal(result.syncSummary.length, 0);
      assert.equal(result.failedSyncs, 0);
    }
  });
}

const ids = ['b2000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000002'];
async function sale({ rpcResults = [], deletion = { data: { id: 'order-id' }, error: null }, itemsError = null,
                      insertError = null, throws = false, authorized = true } = {}) {
  const calls = [];
  let rpcIndex = 0;
  const supabase = {
    from(table) {
      calls.push(table);
      if (table === 'products') return query({ data: ids.map(id => ({ id, price: 10, name: id, sku: id, stock_quantity: 10 })), error: null });
      if (table === 'order_items') return query({ data: null, error: itemsError });
      if (table === 'orders') {
        const q = query({ data: { id: 'order-id' }, error: insertError });
        q.delete = () => { calls.push('delete'); return query(deletion); };
        return q;
      }
      throw new Error('Unexpected table: ' + table);
    },
    async rpc(name, args) {
      assert.equal(name, 'record_inventory_movement');
      calls.push(args.p_reference_type);
      if (throws) throw new Error('Lost connection');
      return rpcResults[rpcIndex++] ?? { error: null };
    }
  };
  const { createManualOrderAction } = load('src/features/orders/actions.ts', {
    '@/server/auth/authorization': { authorizePermission: async () => authorized
      ? { authorized: true, supabase, user: { id: 'staff-id' } }
      : { authorized: false, reason: 'forbidden' } },
    'next/cache': { revalidatePath() {} }
  });
  const form = new FormData();
  form.set('customerName', 'Test Customer');
  form.set('customerEmail', ''); form.set('customerPhone', ''); form.set('notes', '');
  form.set('lineItems', JSON.stringify(ids.map(productId => ({ productId, quantity: 1 }))));
  return { result: await createManualOrderAction({}, form), calls };
}
const failure = { error: { code: 'P0001', message: 'Stock unavailable' } };
const ok = { error: null };

test('multi-product failure reports rollback only after restoration and confirmed deletion', async () => {
  const { result, calls } = await sale({ rpcResults: [ok, failure, ok] });
  assert.match(result.message, /was rolled back/);
  assert.deepEqual(calls.filter(x => x.startsWith('manual_')), ['manual_order','manual_order','manual_order_rollback']);
  assert.ok(calls.includes('delete'));
});
test('failed compensation preserves order and returns recovery reference', async () => {
  const { result, calls } = await sale({ rpcResults: [ok, failure, failure] });
  assert.match(result.message, /Recovery required.*order-id/);
  assert.doesNotMatch(result.message, /was rolled back/);
  assert.ok(!calls.includes('delete'));
});
for (const deletion of [{ data: null, error: null }, { data: null, error: { code: '42501' } }]) {
  test('zero-row or rejected deletion never reports successful rollback', async () => {
    const { result } = await sale({ rpcResults: [ok, failure, ok], deletion });
    assert.match(result.message, /Recovery required.*order-id/);
    assert.doesNotMatch(result.message, /was rolled back/);
  });
}
test('lost RPC response preserves order even with permissive A1 deletion policies', async () => {
  const { result, calls } = await sale({ rpcResults: [ok, { error: { message: 'fetch failed', code: '' } }, ok] });
  assert.match(result.message, /Recovery required.*order-id/);
  assert.ok(!calls.includes('delete'));
});
test('thrown transport error includes recovery reference', async () => {
  const { result, calls } = await sale({ throws: true });
  assert.match(result.message, /order-id.*may be partially saved/);
  assert.ok(!calls.includes('delete'));
});
test('lost order-insert response never claims the order was not created', async () => {
  const { result } = await sale({ insertError: { message: 'fetch failed', code: '' } });
  assert.match(result.message, /MAN-.*creation could not be confirmed/);
  assert.doesNotMatch(result.message, /was not created/);
});
test('item-insert failure checks cleanup result', async () => {
  const { result } = await sale({ itemsError: failure.error, deletion: { data: null, error: null } });
  assert.match(result.message, /Recovery required/);
});
test('successful manual sale has no WooCommerce or service-role dependency', async () => {
  const { result, calls } = await sale();
  assert.equal(result.status, 'success');
  assert.ok(!calls.includes('delete'));
});
test('unauthorized manual sale never accesses database tables', async () => {
  const { result, calls } = await sale({ authorized: false });
  assert.equal(result.status, 'error');
  assert.equal(calls.length, 0);
});

for (const code of ['08007', '40003']) {
  test(`unknown transaction outcome ${code} preserves the recovery record`, async () => {
    const { result, calls } = await sale({ rpcResults: [ok, { error: { code, message: 'Completion unknown' } }, ok] });
    assert.match(result.message, /Recovery required/);
    assert.ok(!calls.includes('delete'));
  });
}
