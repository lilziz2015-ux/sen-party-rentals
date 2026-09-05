import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")?.trim() ?? "";
const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL")?.trim() ||
  "Sen Party Rentals <onboarding@resend.dev>";
const SITE_ORIGIN =
  Deno.env.get("SITE_ORIGIN")?.trim().replace(/\/$/, "") ||
  "https://www.senmoonbounce.com";

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "Unknown error");
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function money(value: unknown): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function eventDate(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Not provided";
  const date = new Date(`${raw.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function emailHtml(options: {
  customerName: string;
  bookingNumber: string;
  agreementUrl: string;
  eventDate: string;
  eventLocation: string;
  items: Array<Record<string, unknown>>;
  deliveryFee: number;
  total: number;
}): string {
  const itemRows = options.items.length
    ? options.items
        .map(
          (item) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eeeeee">
                ${escapeHtml(item.name || "Rental item")}
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #eeeeee;text-align:center">
                ${escapeHtml(item.quantity || 1)}
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #eeeeee;text-align:right">
                ${money(item.line_total)}
              </td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="3" style="padding:12px 0;color:#6b7280">See the agreement for rental details.</td></tr>';

  return `<!doctype html>
  <html lang="en">
    <body style="margin:0;background:#f5f5f7;color:#202329;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:680px;margin:0 auto;padding:30px 16px">
        <div style="padding:24px;border-radius:16px 16px 0 0;color:#ffffff;background:#d90429">
          <p style="margin:0 0 7px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Sen Party Rentals</p>
          <h1 style="margin:0;font-size:26px;line-height:1.25">Your Rental Agreement Is Ready</h1>
        </div>
        <div style="padding:26px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 16px 16px;background:#ffffff">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.65">Hello ${escapeHtml(options.customerName)},</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.65">Please review and electronically sign your Sen Party Rentals agreement for booking <strong>${escapeHtml(options.bookingNumber)}</strong>.</p>
          <div style="margin:22px 0;text-align:center">
            <a href="${escapeHtml(options.agreementUrl)}" style="display:inline-block;padding:14px 22px;border-radius:10px;color:#ffffff;background:#d90429;font-weight:800;text-decoration:none">Review &amp; Sign Agreement</a>
          </div>
          <table role="presentation" style="width:100%;margin-top:22px;border-collapse:collapse">
            <tbody>
              <tr><td style="width:145px;padding:7px 0;color:#6b7280">Event date</td><td style="padding:7px 0;font-weight:700">${escapeHtml(options.eventDate)}</td></tr>
              <tr><td style="padding:7px 0;color:#6b7280">Location</td><td style="padding:7px 0;font-weight:700">${escapeHtml(options.eventLocation)}</td></tr>
            </tbody>
          </table>
          <table role="presentation" style="width:100%;margin-top:22px;border-collapse:collapse">
            <thead><tr><th style="padding:10px;text-align:left;background:#111216;color:#ffffff">Rental</th><th style="padding:10px;text-align:center;background:#111216;color:#ffffff">Qty</th><th style="padding:10px;text-align:right;background:#111216;color:#ffffff">Amount</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p style="margin:20px 0 0;line-height:1.7"><strong>Delivery:</strong> ${options.deliveryFee === 0 ? "Free" : money(options.deliveryFee)}<br><strong>Total:</strong> <span style="color:#d90429;font-size:18px;font-weight:800">${money(options.total)}</span></p>
          <p style="margin:24px 0 0;color:#6b7280;font-size:14px;line-height:1.65">If the button does not open, copy this address into your browser:<br><a href="${escapeHtml(options.agreementUrl)}" style="color:#970018;overflow-wrap:anywhere">${escapeHtml(options.agreementUrl)}</a></p>
          <p style="margin:22px 0 0;line-height:1.6"><strong>Sen Party Rentals</strong><br>(571) 719-9575<br>senmoonbounce@gmail.com<br>www.senmoonbounce.com</p>
        </div>
      </div>
    </body>
  </html>`;
}

async function requireOwnerOrAdmin(request: Request): Promise<string> {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Admin sign-in is required.");

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Your admin session is invalid or expired.");

  const { data: adminUser, error: adminError } = await admin
    .from("admin_users")
    .select("id, role, active")
    .eq("user_id", userData.user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError) throw new Error(`Admin access check failed: ${adminError.message}`);
  if (!adminUser || !["OWNER", "ADMIN"].includes(String(adminUser.role || "").toUpperCase())) {
    throw new Error("Owner or administrator access is required.");
  }

  return String(adminUser.id);
}

async function logNotification(values: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from("notification_logs").insert(values);
  if (error) console.error("notification log", error);
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return reply({ success: false, error: "Method not allowed." }, 405);

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("The agreement email service is not fully configured.");
    }

    const adminUserId = await requireOwnerOrAdmin(request);
    const payload = await request.json().catch(() => ({}));
    const bookingId = String(payload?.booking_id || "").trim();
    if (!bookingId) return reply({ success: false, error: "A booking ID is required." }, 400);

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, customer_id, booking_number, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) throw new Error(`Booking lookup failed: ${bookingError.message}`);
    if (!booking) return reply({ success: false, error: "Booking could not be found." }, 404);
    if (["CANCELLED", "CANCELED"].includes(String(booking.status || "").toUpperCase())) {
      return reply({ success: false, error: "A cancelled booking agreement cannot be sent." }, 409);
    }

    const { data: agreement, error: agreementError } = await admin
      .from("rental_agreements")
      .select("id, status, access_token, customer_snapshot, booking_snapshot, items_snapshot, updated_at, expires_at")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (agreementError) throw new Error(`Agreement lookup failed: ${agreementError.message}`);
    if (!agreement || agreement.status === "VOID") {
      return reply({ success: false, error: "Create the customer agreement before sending it." }, 409);
    }
    if (agreement.status !== "SIGNED" && new Date(agreement.expires_at).getTime() < Date.now()) {
      return reply({ success: false, error: "This agreement link has expired. Refresh the agreement before sending it." }, 410);
    }

    const customer = (agreement.customer_snapshot || {}) as Record<string, unknown>;
    const bookingSnapshot = (agreement.booking_snapshot || {}) as Record<string, unknown>;
    const items = Array.isArray(agreement.items_snapshot)
      ? (agreement.items_snapshot as Array<Record<string, unknown>>)
      : [];
    const recipient = String(customer.email || "").trim().toLowerCase();
    const customerName = String(customer.name || "Customer").trim() || "Customer";
    const bookingNumber = String(bookingSnapshot.booking_number || booking.booking_number || booking.id);
    if (!isValidEmail(recipient)) {
      return reply({ success: false, error: "The agreement does not contain a valid customer email address." }, 400);
    }

    if (!agreement.access_token) {
      return reply({ success: false, error: "The agreement link is missing. Refresh the agreement before sending it." }, 409);
    }

    const agreementUrl = `${SITE_ORIGIN}/rental-agreement.html?token=${encodeURIComponent(String(agreement.access_token))}`;
    const eventLocation = [
      bookingSnapshot.event_address,
      bookingSnapshot.event_address_2,
      bookingSnapshot.event_city,
      bookingSnapshot.event_state,
      bookingSnapshot.event_zip,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ") || "See agreement";
    const total = Number(bookingSnapshot.displayed_total || 0);
    const deliveryFee = Number(bookingSnapshot.delivery_fee || 0);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `agreement-${agreement.id}-${Math.floor(Date.now() / 60000)}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [recipient],
        subject: `Your Sen Party Rentals Agreement ${bookingNumber}`,
        html: emailHtml({
          customerName,
          bookingNumber,
          agreementUrl,
          eventDate: eventDate(bookingSnapshot.event_date),
          eventLocation,
          items,
          deliveryFee,
          total,
        }),
      }),
    });

    const responseText = await resendResponse.text();
    let resendResult: Record<string, unknown> = {};
    try {
      resendResult = responseText ? JSON.parse(responseText) : {};
    } catch {
      resendResult = { message: responseText };
    }

    if (!resendResponse.ok) {
      const providerError = String(resendResult.message || resendResult.error || "The email provider rejected the request.");
      await logNotification({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        channel: "EMAIL",
        notification_type: "RENTAL_AGREEMENT_CUSTOMER",
        recipient,
        subject: `Your Sen Party Rentals Agreement ${bookingNumber}`,
        status: "FAILED",
        provider: "RESEND",
        provider_message_id: null,
        error_message: providerError,
        attempt_count: 1,
      });
      const setupHint = providerError.toLowerCase().includes("testing emails")
        ? " Verify senmoonbounce.com in Resend and set FROM_EMAIL to an address on that domain."
        : "";
      return reply({ success: false, error: `${providerError}${setupHint}` }, 502);
    }

    const providerMessageId = String(resendResult.id || "") || null;
    await logNotification({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      channel: "EMAIL",
      notification_type: "RENTAL_AGREEMENT_CUSTOMER",
      recipient,
      subject: `Your Sen Party Rentals Agreement ${bookingNumber}`,
      status: "SENT",
      provider: "RESEND",
      provider_message_id: providerMessageId,
      error_message: null,
      attempt_count: 1,
      sent_at: new Date().toISOString(),
    });
    await admin.from("activity_logs").insert({
      admin_user_id: adminUserId,
      booking_id: booking.id,
      action_type: "SEND_RENTAL_AGREEMENT_EMAIL",
      entity_type: "rental_agreement",
      entity_id: agreement.id,
      description: `Rental agreement emailed to ${recipient}`,
      metadata: {
        booking_id: booking.id,
        booking_number: bookingNumber,
        recipient,
        provider_message_id: providerMessageId,
      },
    });

    return reply({
      success: true,
      recipient,
      booking_number: bookingNumber,
      provider_message_id: providerMessageId,
    });
  } catch (error) {
    console.error("send-agreement-email", error);
    return reply({ success: false, error: errorMessage(error) }, 500);
  }
});
