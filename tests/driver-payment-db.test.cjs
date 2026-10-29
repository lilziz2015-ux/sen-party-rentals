const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const driver = '00000000-0000-0000-0000-000000000001';
const stop = '00000000-0000-0000-0000-000000000002';
const booking = '00000000-0000-0000-0000-000000000003';
const request = '00000000-0000-0000-0000-000000000004';

test('payment transaction enforces assignment, balance, atomic writes, and idempotency', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create type payment_method as enum ('CASH','CHECK','ZELLE');
      create type payment_state as enum ('UNPAID','PARTIAL','PAID','REFUNDED');
      create type delivery_state as enum ('UNSCHEDULED','DELIVERED','CANCELLED');
      create type booking_state as enum ('PENDING','CONFIRMED','CANCELLED');
      create table driver_profiles(id uuid primary key, active boolean);
      create table delivery_assignments(id uuid primary key, booking_id uuid, driver_id uuid, status delivery_state);
      create table bookings(id uuid primary key, status booking_state, payment_status payment_state, final_total numeric,
        subtotal numeric, amount_paid numeric, balance_due numeric, paid_at timestamptz, updated_at timestamptz);
      create table payments(id uuid default gen_random_uuid() primary key, booking_id uuid, amount numeric,
        method payment_method, status payment_state, transaction_reference text, notes text, received_by uuid, paid_at timestamptz);
      insert into driver_profiles values('${driver}',true);
      insert into delivery_assignments values('${stop}','${booking}','${driver}','DELIVERED');
      insert into bookings values('${booking}','CONFIRMED','PARTIAL',450,450,50,400,null,now());
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/driver-payments.sql'), 'utf8'));
    const call = (who=driver, expected=400, req=request) => db.query(
      'select record_driver_balance_payment($1,$2,$3,$4,$5) as receipt', [who,stop,req,'CASH',expected]);
    await assert.rejects(call('00000000-0000-0000-0000-000000000099'), /assignment required/);
    await db.exec('update driver_profiles set active=false');
    await assert.rejects(call(), /assignment required/);
    await db.exec('update driver_profiles set active=true');
    await assert.rejects(call(driver, 450), /balance changed/);
    await db.exec(`alter table payments add constraint reject_test check(amount<400)`);
    await assert.rejects(call(), /reject_test/);
    assert.equal((await db.query('select amount_paid from bookings')).rows[0].amount_paid, '50');
    assert.equal((await db.query('select * from payments')).rows.length, 0);
    await db.exec('alter table payments drop constraint reject_test');
    const first = (await call()).rows[0].receipt;
    assert.equal(first.booking.payment_status, 'PAID');
    assert.equal(first.booking.amount_paid, 450);
    assert.equal(first.payment.amount, 400);
    const replay = (await call()).rows[0].receipt;
    assert.equal(replay.payment.id, first.payment.id);
    assert.equal((await db.query('select * from payments')).rows.length, 1);
    await assert.rejects(call(driver,400,'00000000-0000-0000-0000-000000000005'), /No balance is due/);
    await db.exec('set role authenticated');
    await assert.rejects(call(), /permission denied/);
  } finally { await db.close(); }
});
