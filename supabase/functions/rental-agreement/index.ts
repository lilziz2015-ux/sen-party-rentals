import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const AGREEMENT_VERSION = "2026-09-05-delivery-v1";
const AGREEMENT_TITLE = "Rental Agreement and Safety Waiver";
const BOOKING_CREATE_WINDOW_MS = 30 * 60 * 1000;
const SITE_ORIGIN = "https://www.senmoonbounce.com";

const allowedOrigins = new Set([
  "https://senmoonbounce.com",
  SITE_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const BUSINESS = {
  name: "Sen Party Rentals",
  representative: "Saliou Nguer, Owner",
  location: "Manassas, Virginia",
  phone: "(571) 719-9575",
  phone_e164: "+15717199575",
  email: "senmoonbounce@gmail.com",
  website: "https://www.senmoonbounce.com",
};

const TERMS = [
  {
    title: "1. Parties and booking request",
    paragraphs: [
      "This Rental Agreement and Safety Waiver is between the customer identified above and Sen Party Rentals. It applies to the event, delivery location, rental equipment, and services shown in this agreement snapshot.",
      "Submitting a booking request and signing this agreement do not by themselves guarantee availability. A reservation is confirmed only when Sen Party Rentals confirms it in writing and any required payment or deposit has been received.",
    ],
  },
  {
    title: "2. Pricing and payment",
    paragraphs: [
      "The amount shown when this agreement is created is an estimate based on the selected rentals. Delivery is estimated from the event ZIP code as one-way mileage from Manassas: the first 15 miles are free and each additional mile is $2. Sen Party Rentals confirms the final mileage and pricing before approving the reservation.",
      "Setup, hard-surface, permit, tax, distance corrections, or other disclosed charges may be added after review. Sen Party Rentals will disclose the final total before service, and a material change requires the customer's approval.",
      "Payment amounts, due dates, deposit requirements, and accepted methods are those stated in the confirmed quote or invoice. Unpaid amounts remain the customer's responsibility unless Sen Party Rentals agrees otherwise in writing.",
    ],
  },
  {
    title: "3. Delivery location and setup",
    paragraphs: [
      "The customer must provide complete and accurate event, access, surface, power, water, stair, gate, and permit information. The setup area must be safe, level, accessible, free of underground or overhead hazards, and suitable for the equipment.",
      "Sen Party Rentals may refuse, delay, relocate, or cancel a setup that its crew reasonably determines is unsafe or cannot be completed as described. The customer is responsible for obtaining property-owner or public-space permission and required permits.",
    ],
  },
  {
    title: "4. Customer supervision and proper use",
    paragraphs: [
      "A responsible adult must supervise the equipment continuously while it is available for use. The customer must follow all posted rules, manufacturer instructions, capacity limits, age and size restrictions, and verbal safety instructions from Sen Party Rentals.",
      "The customer may not move, alter, disconnect, sublease, lend, or allow unauthorized operation of the equipment. Shoes, sharp objects, food, drinks, gum, silly string, confetti, pets, smoking, flames, and unsafe behavior are prohibited in or near inflatable equipment.",
    ],
  },
  {
    title: "5. Weather and emergency shutdown",
    paragraphs: [
      "Inflatables must not be used during high winds, lightning, severe weather, unsafe rain, loss of power, deflation, or any condition that could make operation unsafe. The customer must immediately stop use, help occupants exit calmly, turn equipment off when instructed, and contact Sen Party Rentals.",
      "Sen Party Rentals may postpone, relocate, shut down, or retrieve equipment when weather or site conditions are unsafe. Weather-related credits, rescheduling, refunds, or cancellations are governed by the confirmed quote and the published cancellation and weather policy.",
    ],
  },
  {
    title: "6. Cancellation and rescheduling",
    paragraphs: [
      "The customer should notify Sen Party Rentals as soon as possible about a cancellation or requested change. Deposits, payments, credits, refunds, and rescheduling depend on timing, equipment preparation, third-party costs, weather, and the terms stated in the confirmed quote or invoice.",
      "Sen Party Rentals may cancel when equipment is unavailable, the site is unsafe, payment requirements are not met, or events outside reasonable control prevent safe performance. Any refund or credit will be handled under the confirmed booking terms and applicable law.",
    ],
  },
  {
    title: "7. Equipment care, damage, and loss",
    paragraphs: [
      "The customer is responsible for reasonable care of the equipment from completed setup until pickup. The customer must promptly report damage, malfunction, theft, vandalism, contamination, or unsafe conditions and stop using affected equipment.",
      "The customer may be charged the reasonable cost to clean, repair, or replace equipment for damage beyond ordinary wear caused by misuse, prohibited materials, unauthorized movement, unsupervised use, negligence, theft, or failure to follow instructions. Sen Party Rentals will provide a reasonable explanation of any charge.",
    ],
  },
  {
    title: "8. Assumption of risk and release",
    paragraphs: [
      "The customer understands that inflatables, slides, games, and event equipment involve risks including falls, collisions, strains, water-related injuries, weather exposure, and equipment misuse. The customer voluntarily assumes the ordinary risks of participation and is responsible for communicating safety rules to guests.",
      "To the fullest extent permitted by law, the customer releases Sen Party Rentals and its owners, employees, and contractors from claims arising from risks inherent in the activity or from the customer's or guests' misuse, lack of supervision, or failure to follow instructions. This release does not waive liability that cannot legally be waived, including liability established by law for gross negligence or willful misconduct.",
    ],
  },
  {
    title: "9. Customer responsibility for third-party claims",
    paragraphs: [
      "To the fullest extent permitted by law, the customer will be responsible for third-party claims, losses, or reasonable costs caused by the customer's breach of this agreement, unsafe site conditions under the customer's control, unauthorized use, inadequate supervision, or intentional or negligent acts of the customer or guests.",
      "This section does not require the customer to protect Sen Party Rentals from the company's own gross negligence, willful misconduct, or any responsibility that applicable law does not allow to be shifted.",
    ],
  },
  {
    title: "10. Electronic records and signature",
    paragraphs: [
      "The customer agrees that typing their full legal name and selecting the separate consent boxes constitutes their electronic signature for this transaction. The signed record is linked to this exact agreement, customer, booking, item, and price snapshot.",
      "The customer may print or save the signed agreement and may request a paper copy at no charge by contacting Sen Party Rentals. The customer may withdraw consent to sign electronically before signing by contacting Sen Party Rentals and arranging a paper process.",
    ],
  },
  {
    title: "11. Entire agreement, severability, and governing law",
    paragraphs: [
      "This signed agreement and the confirmed quote or invoice form the agreement for this rental. Published safety, cancellation, weather, and website policies may provide additional guidance but cannot retroactively change this signed snapshot. If a confirmed quote includes a more specific term, that specific term controls for the booking. Changes must be confirmed in writing.",
      "If a provision is found unenforceable, the remaining provisions continue to the extent allowed by law. Virginia law governs this agreement, without overriding consumer rights or laws that must apply in the event location.",
    ],
  },
];

type JsonObject = Record<string, unknown>;

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : SITE_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function reply(request: Request, body: JsonObject, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function validUuid(value: unknown) {
  const id = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : "";
}

function validAccessToken(value: unknown) {
  const token = String(value || "").trim();
  return /^[A-Za-z0-9_-]{40,180}$/.test(token) ? token : "";
}

function makeAccessToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function agreementUrl(token: string) {
  return `${SITE_ORIGIN}/rental-agreement.html?token=${encodeURIComponent(token)}`;
}

function expirationFor(eventDate: unknown) {
  const raw = String(eventDate || "").slice(0, 10);
  const base = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59Z`)
    : new Date();
  base.setUTCDate(base.getUTCDate() + 180);
  return base.toISOString();
}

function publicAgreement(row: JsonObject) {
  return {
    id: row.id,
    status: row.status,
    agreement_version: row.agreement_version,
    agreement_title: row.agreement_title,
    business: row.business_snapshot,
    customer: row.customer_snapshot,
    booking: row.booking_snapshot,
    items: row.items_snapshot,
    terms: row.terms_snapshot,
    signer_name: row.signer_name,
    signed_at: row.signed_at,
    signature_hash: row.signature_hash,
    created_at: row.created_at,
  };
}

function safeText(value: unknown, fallback = "Not provided") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizedPhone(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return reply(request, { error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) {
      return reply(request, { error: "The agreement service is not configured." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "get").toLowerCase();

    const requireOwnerOrAdmin = async () => {
      const bearer = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!bearer) return null;
      const { data, error } = await admin.auth.getUser(bearer);
      if (error || !data.user) return null;
      const { data: profile } = await admin
        .from("admin_users")
        .select("id, role, active")
        .eq("user_id", data.user.id)
        .eq("active", true)
        .maybeSingle();
      return profile && ["OWNER", "ADMIN"].includes(String(profile.role)) ? profile : null;
    };

    const loadSnapshots = async (bookingId: string) => {
      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
      if (bookingError) throw bookingError;
      if (!booking) return null;

      const [{ data: customer, error: customerError }, { data: items, error: itemsError }] = await Promise.all([
        admin.from("customers").select("*").eq("id", booking.customer_id).maybeSingle(),
        admin.from("booking_items").select("*").eq("booking_id", bookingId).order("created_at", { ascending: true }),
      ]);
      if (customerError) throw customerError;
      if (itemsError) throw itemsError;
      if (!customer) throw new Error("Customer information was not found.");

      const specialInstructions = String(booking.special_instructions || "");
      const organizationFromRequest = specialInstructions.match(/^Organization\/Venue:\s*(.+)$/mi)?.[1]?.trim() || "";
      const customerSnapshot = {
        name: [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || "Customer",
        first_name: safeText(customer.first_name),
        last_name: safeText(customer.last_name),
        phone: safeText(customer.phone),
        email: safeText(customer.email),
        organization: safeText(customer.organization || organizationFromRequest),
      };
      const bookingSnapshot = {
        booking_id: booking.id,
        booking_number: safeText(booking.booking_number, String(booking.id)),
        request_status: safeText(booking.status, "PENDING"),
        event_type: safeText(booking.event_type),
        event_date: safeText(booking.event_date),
        start_time: safeText(booking.start_time),
        end_time: safeText(booking.end_time),
        event_address: safeText(booking.event_address),
        event_address_2: safeText(booking.event_address_2, ""),
        event_city: safeText(booking.event_city),
        event_state: safeText(booking.event_state),
        event_zip: safeText(booking.event_zip),
        setup_location: safeText(booking.setup_location),
        surface_type: safeText(booking.surface_type),
        power_source: safeText(booking.power_source),
        water_access: safeText(booking.water_access),
        stairs: safeText(booking.stairs),
        gate_width: safeText(booking.gate_width),
        park_permit: safeText(booking.park_permit),
        special_instructions: safeText(booking.special_instructions, "None"),
        subtotal: Number(booking.subtotal || 0),
        delivery_distance_miles: booking.delivery_distance_miles == null
          ? null
          : Number(booking.delivery_distance_miles),
        delivery_fee: Number(booking.delivery_fee || 0),
        delivery_fee_method: safeText(booking.delivery_fee_method, "ZIP estimate pending"),
        setup_fee: Number(booking.setup_fee || 0),
        hard_surface_fee: Number(booking.hard_surface_fee || 0),
        discount_amount: Number(booking.discount_amount || 0),
        tax_amount: Number(booking.tax_amount || 0),
        deposit_required: Number(booking.deposit_required || 0),
        displayed_total: Number(booking.final_total ?? booking.subtotal ?? 0),
        currency: "USD",
      };
      const itemsSnapshot = (items || []).map((item) => ({
        name: safeText(item.item_name, "Rental item"),
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        line_total: Number(item.line_total ?? Number(item.quantity || 1) * Number(item.unit_price || 0)),
      }));
      return { booking, customerSnapshot, bookingSnapshot, itemsSnapshot };
    };

    if (action === "create") {
      const bookingId = validUuid(body?.booking_id);
      if (!bookingId) return reply(request, { error: "A valid booking ID is required." }, 400);
      const snapshots = await loadSnapshots(bookingId);
      if (!snapshots) return reply(request, { error: "Booking not found." }, 404);
      const createdAt = new Date(snapshots.booking.created_at).getTime();
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > BOOKING_CREATE_WINDOW_MS) {
        return reply(request, { error: "The automatic agreement window has closed. Please contact Sen Party Rentals." }, 403);
      }
      const providedEmail = String(body?.customer_email || "").trim().toLowerCase();
      const providedPhone = normalizedPhone(body?.customer_phone);
      const savedEmail = String(snapshots.customerSnapshot.email || "").trim().toLowerCase();
      const savedPhone = normalizedPhone(snapshots.customerSnapshot.phone);
      if (
        !providedEmail ||
        providedEmail !== savedEmail ||
        providedPhone.length < 7 ||
        providedPhone !== savedPhone
      ) {
        return reply(request, { error: "The customer details could not be verified for this booking." }, 403);
      }

      const { data: existing, error: existingError } = await admin
        .from("rental_agreements")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        return reply(request, {
          success: true,
          agreement_url: agreementUrl(String(existing.access_token)),
        });
      }

      const accessToken = makeAccessToken();
      const { data: created, error: createError } = await admin
        .from("rental_agreements")
        .insert({
          booking_id: bookingId,
          access_token: accessToken,
          agreement_version: AGREEMENT_VERSION,
          agreement_title: AGREEMENT_TITLE,
          business_snapshot: BUSINESS,
          customer_snapshot: snapshots.customerSnapshot,
          booking_snapshot: snapshots.bookingSnapshot,
          items_snapshot: snapshots.itemsSnapshot,
          terms_snapshot: TERMS,
          expires_at: expirationFor(snapshots.booking.event_date),
        })
        .select("*")
        .single();
      if (createError || !created) throw createError || new Error("Agreement could not be created.");
      return reply(request, {
        success: true,
        agreement_url: agreementUrl(accessToken),
      });
    }

    if (action === "get" || action === "sign") {
      const token = validAccessToken(body?.token);
      if (!token) return reply(request, { error: "This agreement link is invalid." }, 400);
      const { data: agreement, error } = await admin
        .from("rental_agreements")
        .select("*")
        .eq("access_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!agreement || agreement.status === "VOID") {
        return reply(request, { error: "This agreement could not be found." }, 404);
      }
      const expired = new Date(agreement.expires_at).getTime() < Date.now();
      if (expired && agreement.status !== "SIGNED") {
        return reply(request, { error: "This agreement link has expired. Please contact Sen Party Rentals." }, 410);
      }

      if (action === "get") {
        await admin.from("rental_agreements").update({ last_viewed_at: new Date().toISOString() }).eq("id", agreement.id);
        return reply(request, { success: true, agreement: publicAgreement(agreement) });
      }

      if (agreement.status === "SIGNED") {
        return reply(request, { success: true, already_signed: true, agreement: publicAgreement(agreement) });
      }
      const signerName = String(body?.signer_name || "").replace(/\s+/g, " ").trim();
      if (signerName.length < 2 || signerName.length > 120) {
        return reply(request, { error: "Enter your full legal name to sign." }, 400);
      }
      if (body?.electronic_consent !== true || body?.terms_accepted !== true) {
        return reply(request, { error: "Both agreement boxes must be selected before signing." }, 400);
      }

      const signedAt = new Date().toISOString();
      const forwarded = String(request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown")
        .split(",")[0].trim().slice(0, 80);
      const userAgent = String(request.headers.get("user-agent") || "unknown").slice(0, 500);
      const ipHash = await sha256(`${agreement.id}|${forwarded}`);
      const signatureHash = await sha256(JSON.stringify({
        agreement_id: agreement.id,
        agreement_version: agreement.agreement_version,
        business: agreement.business_snapshot,
        customer: agreement.customer_snapshot,
        booking: agreement.booking_snapshot,
        items: agreement.items_snapshot,
        terms: agreement.terms_snapshot,
        signer_name: signerName,
        signed_at: signedAt,
      }));
      const { data: signed, error: signError } = await admin
        .from("rental_agreements")
        .update({
          status: "SIGNED",
          signer_name: signerName,
          electronic_consent: true,
          terms_accepted: true,
          signed_at: signedAt,
          signer_ip_hash: ipHash,
          signer_user_agent: userAgent,
          signature_hash: signatureHash,
          updated_at: signedAt,
          last_viewed_at: signedAt,
        })
        .eq("id", agreement.id)
        .eq("status", "PENDING")
        .select("*")
        .maybeSingle();
      if (signError) throw signError;
      if (!signed) return reply(request, { error: "This agreement was already signed or changed. Refresh the page." }, 409);
      return reply(request, { success: true, agreement: publicAgreement(signed) });
    }

    if (action === "admin_status" || action === "admin_refresh") {
      const caller = await requireOwnerOrAdmin();
      if (!caller) return reply(request, { error: "Owner or administrator access is required." }, 403);
      const bookingId = validUuid(body?.booking_id);
      if (!bookingId) return reply(request, { error: "A valid booking ID is required." }, 400);
      const { data: existing, error: existingError } = await admin
        .from("rental_agreements")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (existingError) throw existingError;

      if (action === "admin_status") {
        return reply(request, existing ? {
          success: true,
          exists: true,
          agreement_url: agreementUrl(String(existing.access_token)),
          agreement: publicAgreement(existing),
        } : { success: true, exists: false });
      }

      if (existing?.status === "SIGNED") {
        return reply(request, { error: "A signed agreement is locked and cannot be changed." }, 409);
      }
      const snapshots = await loadSnapshots(bookingId);
      if (!snapshots) return reply(request, { error: "Booking not found." }, 404);
      const accessToken = makeAccessToken();
      const replacement = {
        access_token: accessToken,
        agreement_version: AGREEMENT_VERSION,
        agreement_title: AGREEMENT_TITLE,
        business_snapshot: BUSINESS,
        customer_snapshot: snapshots.customerSnapshot,
        booking_snapshot: snapshots.bookingSnapshot,
        items_snapshot: snapshots.itemsSnapshot,
        terms_snapshot: TERMS,
        expires_at: expirationFor(snapshots.booking.event_date),
        updated_at: new Date().toISOString(),
      };
      const query = existing
        ? admin.from("rental_agreements").update(replacement).eq("id", existing.id)
        : admin.from("rental_agreements").insert({ booking_id: bookingId, ...replacement });
      const { data: refreshed, error: refreshError } = await query.select("*").single();
      if (refreshError || !refreshed) throw refreshError || new Error("Agreement could not be refreshed.");
      return reply(request, {
        success: true,
        exists: true,
        agreement_url: agreementUrl(accessToken),
        agreement: publicAgreement(refreshed),
      });
    }

    return reply(request, { error: "Unsupported agreement action." }, 400);
  } catch (error) {
    console.error("rental-agreement", error);
    return reply(request, { error: error instanceof Error ? error.message : "Agreement request failed." }, 500);
  }
});
