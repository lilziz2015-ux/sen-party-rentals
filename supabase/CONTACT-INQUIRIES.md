# Website contact inquiries

`contact-inquiries.sql` creates private storage and a service-role-only reservation function. The public `contact-inquiry` Edge Function validates the website origin and publishable API key, validates message fields, hashes request identifiers, applies durable email/IP rate limits, and sends only to `senmoonbounce@gmail.com`. It does not create bookings or send automated customer replies.

Server-only settings: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and a verified `FROM_EMAIL`. The function performs its own publishable-key check and is deployed with `verify_jwt=false` so visitors do not need accounts. Existing admin and driver JWT settings are unchanged.

Retries reuse a UUID and Resend idempotency key. Messages are saved before delivery; provider failures remain `FAILED` and the browser reports failure rather than showing a success message. A successful email response updates the private record to `SENT`. If the final status update fails after the provider accepted an email, the function logs the inquiry ID; check the provider before manually resending.

Verification includes local storage/permission/rate-limit tests and mocked provider success/failure/retry tests. Production health and invalid-input checks do not send email. A real email delivery should be checked with an intentionally authorized owner test, rather than creating a customer inquiry for testing.
