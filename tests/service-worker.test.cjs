const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function worker() {
  const handlers = {}, calls = [], removed = [];
  let cacheOpens = 0;
  const context = {
    URL, console,
    self: { location: { origin: 'https://www.senmoonbounce.com' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: { claim: async () => {} } },
    fetch: async (request, options) => { calls.push({request, options}); return {status: 200}; },
    caches: {
      open: async () => { cacheOpens++; return {match: async () => null}; },
      keys: async () => ['sen-party-rentals-runtime-v55', 'sen-party-rentals-static-v56', 'unrelated-cache'],
      delete: async name => { removed.push(name); }
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../service-worker.js'), 'utf8'), context);
  return { handlers, calls, removed, cacheOpens: () => cacheOpens };
}

test('admin, driver and token-bearing pages use network only with no-store', async () => {
  const w = worker();
  for (const resource of ['/admin.html', '/admin-login.html?next=abc', '/admin-booking.html?id=1',
    '/driver.html', '/driver-deliveries.html', '/rental-agreement.html?token=abc', '/index.html?code=abc']) {
    let response;
    w.handlers.fetch({request: {url: 'https://www.senmoonbounce.com' + resource, method: 'GET', mode: 'navigate'},
      respondWith: value => { response = value; }});
    await response;
    assert.equal(w.calls.at(-1).options.cache, 'no-store', resource);
  }
  assert.equal(w.cacheOpens(), 0);
});

test('activation removes the old caches that could contain private URLs', async () => {
  const w = worker();
  let done;
  w.handlers.activate({waitUntil: task => { done = task; }});
  await done;
  assert.deepEqual(w.removed, ['sen-party-rentals-runtime-v55']);
});

test('Supabase API calls and non-GET requests never enter the cache router', () => {
  const w = worker();
  for (const request of [
    {url: 'https://example.supabase.co/rest/v1/bookings', method: 'GET'},
    {url: 'https://www.senmoonbounce.com/booking.html', method: 'POST'}
  ]) {
    let intercepted = false;
    w.handlers.fetch({request, respondWith: () => { intercepted = true; }});
    assert.equal(intercepted, false);
  }
  assert.equal(w.cacheOpens(), 0);
});
