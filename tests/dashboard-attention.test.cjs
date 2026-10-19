const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('attention links include past unpaid events and omit cancelled bookings', () => {
  const source = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
  const start = source.indexOf('  function renderAttention(){');
  const end = source.indexOf('  function renderActivity()', start);
  const output = {};
  const context = {
    state: {bookings: [
      {id: 'past', event_date: '2026-09-12', status: 'COMPLETED', balance: 175},
      {id: 'cancelled', event_date: '2026-10-20', status: 'CANCELLED', balance: 400}
    ]},
    customerFor: () => ({phone: '5550100'}), nameOf: () => 'Customer',
    dateFmt: value => value, balanceOf: booking => booking.balance,
    ROUTES: {booking: './admin-booking.html'}, encodeURIComponent,
    money: {format: amount => '$' + amount}, esc: value => value,
    $: () => output
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  context.renderAttention();
  assert.match(output.innerHTML, /Balance due \$175/);
  assert.match(output.innerHTML, /href="\.\/admin-booking.html\?id=past"/);
  assert.doesNotMatch(output.innerHTML, /cancelled|\$400/);
});
