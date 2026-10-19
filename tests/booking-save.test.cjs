const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

async function saveWith(bookingError) {
  const source = fs.readFileSync(path.join(__dirname, '../admin-booking.html'), 'utf8');
  const saveFunction = source.match(/    async function saveBookingChanges[^\n]+/)[0];
  const values = {
    'customer-first-name': 'Nikki', 'customer-last-name': 'Smith', 'customer-phone': '5550100',
    'event-date': '2026-10-17', 'event-address': 'Example Road', 'event-city': 'Manassas',
    'event-state': 'VA', 'event-zip': '20112', 'booking-status': 'COMPLETED', 'payment-status': 'PAID'
  };
  const alerts = [], writes = [];
  let saving = false;
  const context = {
    console: { error() {} }, Date, Error,
    state: { saving: false, bookingId: 'booking-1', booking: {customer_id: 'customer-1', status: 'CONFIRMED'} },
    $: id => ({value: values[id] || ''}),
    hideAlert: () => { alerts.length = 0; },
    showAlert: (text, type) => { alerts.push({text, type}); },
    setSaving: value => { saving = value; },
    currentFinancialValues: () => ({finalTotal: 245, amountPaid: 245, balanceDue: 0}),
    errorMessage: error => error.message,
    loadBooking: async () => { alerts.length = 0; },
    senSupabase: {
      from(table) {
        return {update(payload) {
          writes.push({table, payload});
          return {eq() { return {select() { return {single: async () => ({
            data: table === 'bookings' && bookingError ? null : {id: 'saved'},
            error: table === 'bookings' ? bookingError : null
          })}; }}; }};
        }};
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(saveFunction, context);
  await context.saveBookingChanges({preventDefault() {}});
  return {alerts, writes, saving};
}

test('a zero-row/denied update never reports the booking as saved', async () => {
  const result = await saveWith(new Error('Cannot coerce the result to a single JSON object'));
  assert.equal(result.saving, false);
  assert.equal(result.alerts.some(alert => alert.type === 'success'), false);
  assert.match(result.alerts.at(-1).text, /could not be updated/);
});

test('confirmed writes retain the success notice after the booking refresh', async () => {
  const result = await saveWith(null);
  assert.equal(result.saving, false);
  assert.equal(result.alerts.at(-1).type, 'success');
  const booking = result.writes.find(write => write.table === 'bookings').payload;
  assert.equal(booking.payment_status, 'PAID');
  assert.equal(booking.balance_due, 0);
  assert.equal(booking.status, 'COMPLETED');
  assert.ok(booking.completed_at);
});
