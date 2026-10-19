# Driver payment deployment

This feature is implemented locally. Do not publish driver.html alone: the database function and Edge Function are required.

1. Verify the target is Sen Party Rentals (`tuttkwpnicgfcyeptrkv`), never WarGo.
2. Run `npm ci` and `npm test`. The local database fixture checks transaction rollback, access restrictions, stale balances, duplicate requests and payment reconciliation. It does not replace testing against the actual rental schema and policies.
3. Review and apply `driver-payments.sql` in the rentals database. It creates one service-only, security-invoker transaction. It does not grant drivers direct booking/payment update access or change existing RLS policies.
4. Deploy the `driver-payment` Edge Function with JWT verification enabled. It additionally validates the user with Auth and checks their active driver profile and assignment. Configure the existing service credentials, `RESEND_API_KEY` and a verified `FROM_EMAIL` securely in Supabase.
5. Test with an assigned driver and a disposable test booking in a nonproduction copy of the actual rentals schema: show the correct due balance, reject another driver's stop and an inactive driver, record cash/check/Zelle once, handle a stale balance, retry the same request, and verify receipt email acceptance. Verify payment totals in admin. Confirm database errors roll back both writes.
6. Test email-provider failure: the payment must remain recorded, and retrying Send Receipt must not create another payment. Confirm a missing customer email is reported clearly. Verify receipt logs and provider idempotency.
7. Publish the website assets only after those checks pass. No live payment or customer email is created by the local tests.

Drivers record the full remaining balance only after receiving money. This does not charge a card or independently verify a Zelle transfer. Card confirmations remain with the office. Sending a receipt is a separate action using the stored customer email and payment values. Paid status does not automatically mark delivery or booking completion.

To roll back the UI, restore the prior driver.html and remove its driver-payment asset references. The restricted backend can remain deployed without exposing direct browser writes. Do not delete recorded payments during rollback.
