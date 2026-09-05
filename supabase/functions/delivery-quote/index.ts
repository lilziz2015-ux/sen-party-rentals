import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SITE_ORIGIN = "https://www.senmoonbounce.com";
const ORIGIN_ZIP = "20112";
const ORIGIN_LATITUDE = 38.6665;
const ORIGIN_LONGITUDE = -77.4248;
const FREE_MILES = 15;
const RATE_PER_MILE = 2;
const ROAD_DISTANCE_FACTOR = 1.2;
const BOOKING_APPLY_WINDOW_MS = 30 * 60 * 1000;
const CALCULATION_METHOD = "ZIP_CENTROID_ESTIMATE_V1";

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

type JsonObject = Record<string, unknown>;

type ZipLocation = {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
};

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

function normalizedPhone(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function normalizedZip(value: unknown) {
  const match = String(value || "").trim().match(/^(\d{5})(?:-\d{4})?$/);
  return match?.[1] || "";
}

function normalizedState(value: unknown) {
  const state = String(value || "").trim().toUpperCase().replaceAll(".", "");
  const names: Record<string, string> = {
    VIRGINIA: "VA",
    MARYLAND: "MD",
    "WASHINGTON, DC": "DC",
    "WASHINGTON DC": "DC",
    "DISTRICT OF COLUMBIA": "DC",
    "WEST VIRGINIA": "WV",
    PENNSYLVANIA: "PA",
  };
  return names[state] || state;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function radians(degrees: number) {
  return degrees * Math.PI / 180;
}

function straightLineMiles(latitude: number, longitude: number) {
  const earthRadiusMiles = 3958.8;
  const latitudeDelta = radians(latitude - ORIGIN_LATITUDE);
  const longitudeDelta = radians(longitude - ORIGIN_LONGITUDE);
  const startLatitude = radians(ORIGIN_LATITUDE);
  const endLatitude = radians(latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function lookupZip(zip: string): Promise<ZipLocation> {
  if (zip === ORIGIN_ZIP) {
    return {
      latitude: ORIGIN_LATITUDE,
      longitude: ORIGIN_LONGITUDE,
      city: "Manassas",
      state: "VA",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
      headers: { "User-Agent": "SenPartyRentals/1.0 (https://www.senmoonbounce.com)" },
      signal: controller.signal,
    });
    if (response.status === 404) throw new Error("That ZIP code could not be found.");
    if (!response.ok) throw new Error("The ZIP code service is temporarily unavailable.");
    const result = await response.json();
    const place = Array.isArray(result?.places) ? result.places[0] : null;
    const latitude = Number(place?.latitude);
    const longitude = Number(place?.longitude);
    if (!place || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("That ZIP code could not be located.");
    }
    return {
      latitude,
      longitude,
      city: String(place["place name"] || "").trim(),
      state: normalizedState(place["state abbreviation"]),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function calculateQuote(rawZip: unknown, rawState: unknown) {
  const zip = normalizedZip(rawZip);
  if (!zip) throw new Error("Enter a valid 5-digit ZIP code.");
  const location = await lookupZip(zip);
  const suppliedState = normalizedState(rawState);
  if (suppliedState && location.state && suppliedState !== location.state) {
    throw new Error(`ZIP ${zip} is in ${location.state}, not ${suppliedState}.`);
  }

  const directMiles = straightLineMiles(location.latitude, location.longitude);
  const distanceMiles = Math.max(0, Math.round(directMiles * ROAD_DISTANCE_FACTOR));
  const billableMiles = Math.max(0, distanceMiles - FREE_MILES);
  const deliveryFee = roundMoney(billableMiles * RATE_PER_MILE);

  return {
    zip,
    city: location.city,
    state: location.state,
    distance_miles: distanceMiles,
    free_miles: FREE_MILES,
    billable_miles: billableMiles,
    rate_per_mile: RATE_PER_MILE,
    delivery_fee: deliveryFee,
    calculation_method: CALCULATION_METHOD,
    is_estimate: true,
    disclaimer: "Estimated one-way driving miles based on ZIP-code location. Final mileage and delivery pricing are confirmed by Sen Party Rentals.",
  };
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
      return reply(request, { error: "The delivery calculator is not configured." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "quote").toLowerCase();

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

    if (action === "quote") {
      const quote = await calculateQuote(body?.zip, body?.state);
      return reply(request, { success: true, quote });
    }

    if (action !== "apply" && action !== "admin_apply") {
      return reply(request, { error: "Unsupported delivery-calculator action." }, 400);
    }

    const bookingId = validUuid(body?.booking_id);
    if (!bookingId) return reply(request, { error: "A valid booking ID is required." }, 400);
    if (action === "admin_apply" && !(await requireOwnerOrAdmin())) {
      return reply(request, { error: "Owner or administrator access is required." }, 403);
    }

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return reply(request, { error: "Booking not found." }, 404);

    const { data: customer, error: customerError } = await admin
      .from("customers")
      .select("email, phone")
      .eq("id", booking.customer_id)
      .maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return reply(request, { error: "Customer information was not found." }, 404);

    const { data: agreement, error: agreementError } = await admin
      .from("rental_agreements")
      .select("status")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (agreementError) throw agreementError;
    if (agreement?.status === "SIGNED") {
      return reply(request, { error: "A signed agreement is locked. Create an approved amendment before changing delivery pricing." }, 409);
    }
    if (action === "apply" && agreement) {
      return reply(request, { error: "The agreement was already prepared. Ask Sen Party Rentals to recalculate delivery." }, 409);
    }

    if (action === "apply") {
      const createdAt = new Date(booking.created_at).getTime();
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > BOOKING_APPLY_WINDOW_MS) {
        return reply(request, { error: "The automatic delivery-calculation window has closed." }, 403);
      }
      const providedEmail = String(body?.customer_email || "").trim().toLowerCase();
      const providedPhone = normalizedPhone(body?.customer_phone);
      const savedEmail = String(customer.email || "").trim().toLowerCase();
      const savedPhone = normalizedPhone(customer.phone);
      if (!providedEmail || providedEmail !== savedEmail || providedPhone.length < 7 || providedPhone !== savedPhone) {
        return reply(request, { error: "The customer details could not be verified for this booking." }, 403);
      }
    }

    const quote = await calculateQuote(booking.event_zip, booking.event_state);
    const oldDeliveryFee = Number(booking.delivery_fee || 0);
    const currentTotal = Number(booking.final_total ?? booking.subtotal ?? 0);
    const amountPaid = Number(booking.amount_paid || 0);
    const estimatedTotal = roundMoney(Math.max(0, currentTotal - oldDeliveryFee + quote.delivery_fee));
    const balanceDue = roundMoney(Math.max(0, estimatedTotal - amountPaid));
    const calculatedAt = new Date().toISOString();

    const { data: updated, error: updateError } = await admin
      .from("bookings")
      .update({
        delivery_distance_miles: quote.distance_miles,
        delivery_fee: quote.delivery_fee,
        delivery_fee_calculated_at: calculatedAt,
        delivery_fee_method: CALCULATION_METHOD,
        final_total: estimatedTotal,
        balance_due: balanceDue,
        updated_at: calculatedAt,
      })
      .eq("id", bookingId)
      .select("id, booking_number, subtotal, delivery_distance_miles, delivery_fee, final_total, balance_due")
      .single();
    if (updateError || !updated) throw updateError || new Error("The delivery estimate could not be saved.");

    return reply(request, {
      success: true,
      quote: {
        ...quote,
        subtotal: Number(updated.subtotal || 0),
        estimated_total: Number(updated.final_total || 0),
        balance_due: Number(updated.balance_due || 0),
        calculated_at: calculatedAt,
      },
    });
  } catch (error) {
    console.error("delivery-quote", error);
    const message = error instanceof Error ? error.message : "The delivery estimate could not be calculated.";
    const status = /ZIP|valid 5-digit|located|unavailable|timed out|abort/i.test(message) ? 400 : 500;
    return reply(request, { error: message }, status);
  }
});
