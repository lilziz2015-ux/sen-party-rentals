const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup(failReceipt = false) {
  const elements = {}, handlers = {}, calls = [], alerts = [];
  const $ = id => elements[id] ||= {value: 'CASH', addEventListener(event, fn) {handlers[id] = fn;}};
  const state = {selectedAssignmentId: 'stop', assignments: [{id: 'stop', booking_id: 'booking'}],
    bookings: new Map([['booking', {id: 'booking', final_total: 450, amount_paid: 0, balance_due: 450}]])};
  const window = {confirm: () => true};
  const context = {window, crypto: {randomUUID: () => 'request'}, Intl, Number, Map, Error, SyntaxError};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/admin-common.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/driver-payments.js'), 'utf8'), context);
  const controller = window.SenDriverPayments({$, state, renderAssignments() {}, hideAlert() {},
    showAlert: (node, text) => alerts.push(text), db: {functions: {async invoke(name, {body}) {
      calls.push(body);
      if (body.action === 'latest') return {data: {success: true, payment: null}};
      if (body.action === 'receipt' && failReceipt) return {error: {message: 'Email unavailable'}};
      if (body.action === 'receipt') return {data: {success: true, recipient: 'customer@example.com'}};
      return {data: {success: true, booking: {id:'booking', final_total:450, amount_paid:450, balance_due:0}, payment: {id:'payment'}}};
    }}}});
  return {controller, handlers, calls, alerts, elements, state};
}

test('driver sees the balance, records once, and sends a separate receipt', async () => {
  const f = setup();
  await f.controller.open();
  assert.equal(f.elements['driver-balance'].textContent, '$450.00');
  await f.handlers['record-driver-payment']();
  assert.equal(f.elements['driver-balance'].textContent, '$0.00');
  assert.equal(f.elements['record-driver-payment'].disabled, true);
  await f.handlers['send-driver-receipt']();
  assert.deepEqual(f.calls.map(call => call.action), ['latest', 'record', 'receipt']);
  assert.equal(f.calls[1].expected_balance, 450);
  assert.equal(f.calls[2].payment_id, 'payment');
});

test('receipt failure never records another payment and can be retried', async () => {
  const f = setup(true);
  await f.controller.open();
  await f.handlers['record-driver-payment']();
  await f.handlers['send-driver-receipt']();
  await f.handlers['send-driver-receipt']();
  assert.equal(f.calls.filter(call => call.action === 'record').length, 1);
  assert.equal(f.state.bookings.get('booking').amount_paid, 450);
  assert.match(f.alerts.at(-1), /Payment stays recorded/);
});
