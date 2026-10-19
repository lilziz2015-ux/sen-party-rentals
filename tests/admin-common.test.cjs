const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
function adminAt(page = '/admin-booking.html?id=booking-1') {
  const url = new URL(page, 'https://www.senmoonbounce.com');
  const context = { window: {}, URL, location: url };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/admin-common.js'), 'utf8'), context);
  return context.window.SenAdmin;
}

test('manual cash payment is reflected in receipts and balances', () => {
  const admin = adminAt();
  const booking = { id: 'nikki', final_total: 245, amount_paid: 245 };
  assert.equal(admin.amountPaid(booking, []), 245);
  assert.equal(admin.balanceDue(booking, []), 0);
});

test('summary and ledger overlap without doubling the payment', () => {
  const admin = adminAt();
  const booking = { id: 'crystal', final_total: 2075, amount_paid: 2075 };
  const payments = [
    { booking_id: 'crystal', amount: 1000, status: 'COMPLETED' },
    { booking_id: 'crystal', amount: '1075', status: 'SUCCEEDED' },
    { booking_id: 'crystal', amount: 200, status: 'PENDING' },
    { booking_id: 'other', amount: 100, status: 'PAID' }
  ];
  assert.equal(admin.amountPaid(booking, payments), 2075);
  assert.equal(admin.balanceDue(booking, payments), 0);
});

test('completed ledger payments remain visible when the summary is stale', () => {
  const admin = adminAt();
  const booking = { id: 'tyler', final_total: 465, amount_paid: 0 };
  const payments = [{ booking_id: 'tyler', amount: 465, status: 'PAID' }];
  assert.equal(admin.amountPaid(booking, payments), 465);
  assert.equal(admin.balanceDue(booking, payments), 0);
  assert.equal(admin.amountPaid(undefined, [{ amount: 99, status: 'PAID' }]), 0);
});

test('aggregate totals include manual payments and unlinked completed receipts exactly once', () => {
  const admin = adminAt();
  assert.equal(admin.totalCollected([
    { id: 'manual', amount_paid: 245 }, { id: 'card', amount_paid: 465 }
  ], [
    { booking_id: 'card', status: 'COMPLETED', amount: 465 },
    { booking_id: null, status: 'PAID', amount: 20 },
    { booking_id: null, status: 'FAILED', amount: 900 }
  ]), 730);
});

test('saved balances are preserved and invalid amounts cannot poison totals', () => {
  const admin = adminAt();
  assert.equal(admin.balanceDue({ final_total: 350, balance_due: 175 }, []), 175);
  assert.equal(admin.balanceDue({ final_total: 350, balance_due: 'bad', amount_paid: 175 }, []), 175);
  assert.equal(admin.amountPaid({ id: 'a', amount_paid: 'bad' }, [
    { booking_id: 'a', amount: NaN, status: 'PAID' },
    { booking_id: 'a', amount: -50, status: 'PAID' }
  ]), 0);
});

test('sign-in returns to the requested booking, tab, and date filters', () => {
  const current = '/admin-deliveries.html?booking=abc&date=2026-10-17#deliveries';
  const admin = adminAt(current);
  const login = new URL(admin.loginUrl(), 'https://www.senmoonbounce.com');
  assert.equal(login.pathname, '/admin-login.html');
  assert.equal(admin.destination(login.searchParams.get('next')), current);
});

test('next cannot redirect off site, to login again, or carry authentication secrets', () => {
  const admin = adminAt('/admin-login.html');
  for (const next of ['https://evil.test/admin.html', '//evil.test/admin.html',
    '/admin-login.html', '/rental-agreement.html?token=secret', '/admin.html?access_token=secret',
    'javascript:alert(1)', '/index.html']) {
    assert.equal(admin.destination(next), './admin.html', next);
  }
});
