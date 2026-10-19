const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const fields = [{id: 'event-date', value: '2026-10-17'}, {id: 'amount-paid', value: '245'}];
  const listeners = {}, status = {}, prompts = [];
  const root = {querySelectorAll: () => fields, addEventListener: (name, fn) => {listeners[name] = fn;}};
  const window = {addEventListener: (name, fn) => {listeners[name] = fn;},
    confirm: message => {prompts.push(message); return false;}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/admin-common.js'), 'utf8'), {window});
  return {fields, status, listeners, prompts, guard: window.SenAdmin.watchEdits(root, status)};
}

test('booking edits warn before leaving and reverting clears the warning', () => {
  const {fields, guard, status, listeners} = setup();
  assert.equal(guard.isDirty(), false);
  guard.markSaved();
  fields[0].value = '2026-10-18';
  listeners.input();
  assert.equal(status.textContent, 'Unsaved changes');
  let prevented = false;
  listeners.beforeunload({preventDefault() {prevented = true;}});
  assert.equal(prevented, true);
  fields[0].value = '2026-10-17';
  listeners.change();
  assert.equal(guard.isDirty(), false);
  assert.equal(status.textContent, 'All changes saved');
});

test('refresh cancellation retains edits and successful reload resets the baseline', () => {
  const {fields, guard, prompts, status} = setup();
  guard.markSaved();
  assert.equal(guard.confirmDiscard(), true);
  assert.equal(prompts.length, 0);
  fields[1].value = '0';
  assert.equal(guard.confirmDiscard(), false);
  assert.equal(fields[1].value, '0');
  guard.markSaved();
  assert.equal(guard.isDirty(), false);
  assert.equal(status.textContent, 'All changes saved');
});

test('customer and event controls participate in native save validation', () => {
  const html = fs.readFileSync(path.join(__dirname, '../admin-booking.html'), 'utf8');
  for (const [tag] of html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)) {
    assert.match(tag, /form="booking-update-form"/);
  }
  for (const id of ['customer-first-name', 'customer-last-name', 'customer-phone', 'event-date', 'event-address']) {
    const tag = html.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'))[0];
    assert.match(tag, /\brequired\b/);
  }
  assert.match(html, /renderBooking\(\);editGuard\.markSaved\(\)/);
  for (const action of ['recalculateDelivery', 'refreshAgreement', 'sendAgreementEmail']) {
    assert.ok(html.includes('async function ' + action + '(){if(!requireSavedEdits())return;'));
  }
});
