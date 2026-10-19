import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  {auth: {persistSession: false, autoRefreshToken: false}});
const cors = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS"};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers: {...cors, "Content-Type": "application/json"}});
const money = (value: unknown) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(Number(value || 0));

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", {headers: cors});
  if (request.method !== "POST") return reply({error: "Method not allowed"}, 405);
  try {
    const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const {data: auth, error: authError} = await db.auth.getUser(token);
    if (authError || !auth.user) return reply({error: "Driver sign-in required"}, 401);
    const body = await request.json();
    const {data: driver, error: driverError} = await db.from("driver_profiles").select("id").eq("id", auth.user.id).eq("active", true).maybeSingle();
    const {data: assignment, error: assignmentError} = await db.from("delivery_assignments").select("id, booking_id, status")
      .eq("id", body.assignment_id).eq("driver_id", auth.user.id).maybeSingle();
    if (driverError || assignmentError) throw new Error("Driver access could not be verified");
    if (!driver || !assignment || ["CANCELLED", "CANCELED"].includes(assignment.status)) return reply({error: "Active driver assignment required"}, 403);

    if (body.action === "record") {
      const {data, error} = await db.rpc("record_driver_balance_payment", {
        p_driver_id: auth.user.id, p_assignment_id: assignment.id, p_request_id: body.request_id,
        p_method: body.method, p_expected_balance: body.expected_balance
      });
      if (error) return reply({error: error.message}, 409);
      return reply({success: true, ...data});
    }
    if (!["receipt", "latest"].includes(body.action)) return reply({error: "Unknown action"}, 400);
    // Receipt values and destination always come from stored records, never driver input.
    const {data: booking, error: bookingError} = await db.from("bookings")
      .select("id, customer_id, booking_number, final_total, subtotal, amount_paid, balance_due, payment_status")
      .eq("id", assignment.booking_id).single();
    if (bookingError) throw bookingError;
    const {data: rows, error: paymentError} = await db.from("payments").select("id, amount, method, status, paid_at, transaction_reference")
      .eq("booking_id", booking.id).order("paid_at", {ascending: false});
    if (paymentError) throw paymentError;
    const payments = (rows || []).filter(row => ["COMPLETED", "PAID", "SUCCESS", "SUCCEEDED"].includes(String(row.status).toUpperCase()));
    const payment = body.payment_id ? payments.find(row => row.id === body.payment_id) : payments[0];
    booking.amount_paid = Math.max(Number(booking.amount_paid || 0), payments.reduce((sum, row) => sum + Math.max(0, Number(row.amount || 0)), 0));
    const calculatedDue = Math.max(0, Number(booking.final_total ?? booking.subtotal ?? 0) - booking.amount_paid);
    booking.balance_due = booking.balance_due == null ? calculatedDue : Math.min(calculatedDue, Math.max(0, Number(booking.balance_due)));
    if (body.action === "latest") return reply({success: true, payment: payment || null, booking});
    if (!payment) return reply({error: "No completed payment is available for a receipt"}, 409);
    const {data: customer, error: customerError} = await db.from("customers").select("first_name, last_name, email").eq("id", booking.customer_id).single();
    if (customerError) throw customerError;
    const recipient = String(customer.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return reply({error: "Ask the office to add a valid customer email"}, 400);
    const {data: sent, error: logError} = await db.from("notification_logs").select("id")
      .eq("booking_id", booking.id).eq("notification_type", "DRIVER_PAYMENT_RECEIPT")
      .eq("provider", "RESEND").eq("status", "SENT").eq("subject", `Payment receipt ${payment.id}`).limit(1).maybeSingle();
    if (logError) throw logError;
    if (sent) return reply({success: true, recipient, already_sent: true});
    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("FROM_EMAIL");
    if (!key || !from) throw new Error("Receipt email service is not configured");
    const response = await fetch("https://api.resend.com/emails", {method: "POST", headers: {
      Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `driver-receipt-${payment.id}`
    }, body: JSON.stringify({from, to: [recipient], subject: `Sen Party Rentals payment receipt — ${booking.booking_number || booking.id}`,
      text: `Hi ${customer.first_name || "Customer"},\n\nWe received your payment of ${money(payment.amount)} by ${payment.method}.\nBooking: ${booking.booking_number || booking.id}\nPayment date: ${payment.paid_at}\nTotal: ${money(booking.final_total ?? booking.subtotal)}\nAmount paid: ${money(booking.amount_paid)}\nBalance due: ${money(booking.balance_due)}\nReceipt: ${payment.id}\n\nThank you!\nSal\nSen Party Rentals\n571-719-9575`})});
    const provider = await response.json();
    if (!response.ok) throw new Error("Receipt email was not accepted. Payment remains recorded; retry the receipt.");
    const {error: logWriteError} = await db.from("notification_logs").insert({booking_id: booking.id, customer_id: booking.customer_id,
      channel: "EMAIL", notification_type: "DRIVER_PAYMENT_RECEIPT", recipient, subject: `Payment receipt ${payment.id}`,
      status: "SENT", provider: "RESEND", provider_message_id: provider.id, attempt_count: 1, sent_at: new Date().toISOString()});
    if (logWriteError) return reply({success: true, recipient, warning: "Email accepted, but delivery logging failed. Contact the office before resending."});
    return reply({success: true, recipient});
  } catch (error) {
    console.error("driver-payment", error);
    return reply({error: "Driver payment service could not complete the request. Refresh before trying again."}, 500);
  }
});
