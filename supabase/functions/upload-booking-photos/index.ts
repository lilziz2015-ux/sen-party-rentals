import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const BUCKET = "booking-quote-photos";
const MAX_FILES = 6;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const BOOKING_UPLOAD_WINDOW_MS = 30 * 60 * 1000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const allowedOrigins = new Set([
  "https://senmoonbounce.com",
  "https://www.senmoonbounce.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

type FileRequest = {
  name?: unknown;
  type?: unknown;
  size?: unknown;
  path?: unknown;
};

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
      ? origin
      : "https://www.senmoonbounce.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function safeName(value: unknown) {
  const name = String(value || "photo")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 180);
  return name || "photo";
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function validateBookingId(value: unknown) {
  const bookingId = String(value || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    throw new Error("A valid booking ID is required.");
  }
  return bookingId;
}

function validateFiles(value: unknown, includePath = false) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FILES) {
    throw new Error(`Choose between 1 and ${MAX_FILES} photos.`);
  }

  return value.map((raw) => {
    const file = (raw || {}) as FileRequest;
    const name = safeName(file.name);
    const type = String(file.type || "").toLowerCase();
    const size = Number(file.size || 0);
    const path = String(file.path || "").trim();

    if (!ALLOWED_TYPES.has(type)) {
      throw new Error(`${name} must be a JPG, PNG, or WebP image.`);
    }
    if (!Number.isInteger(size) || size < 1 || size > MAX_FILE_BYTES) {
      throw new Error(`${name} must be smaller than 8 MB.`);
    }
    if (includePath && !path) {
      throw new Error(`The upload path for ${name} is missing.`);
    }

    return { name, type, size, path };
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("The photo service is not configured.");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "prepare").toLowerCase();
    const bookingId = validateBookingId(body?.booking_id);

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, created_at")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) throw bookingError;
    if (!booking) return json(req, { error: "Booking not found." }, 404);

    const createdAt = new Date(booking.created_at).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > BOOKING_UPLOAD_WINDOW_MS) {
      return json(req, { error: "The photo upload window has expired. Please text the photos to (571) 719-9575." }, 403);
    }

    if (action === "prepare") {
      const files = validateFiles(body?.files);
      const { count, error: countError } = await admin
        .from("booking_quote_photos")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", bookingId);
      if (countError) throw countError;
      if (Number(count || 0) + files.length > MAX_FILES) {
        return json(req, { error: `A booking can include up to ${MAX_FILES} photos.` }, 409);
      }

      const uploads = [];
      for (const file of files) {
        const path = `${bookingId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
        const { data, error } = await admin.storage
          .from(BUCKET)
          .createSignedUploadUrl(path, { upsert: false });
        if (error || !data?.token) throw error || new Error("Could not prepare photo upload.");
        uploads.push({
          path,
          token: data.token,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }

      return json(req, { uploads });
    }

    if (action === "finalize") {
      const files = validateFiles(body?.files, true);
      if (files.some((file) => !file.path.startsWith(`${bookingId}/`) || file.path.includes(".."))) {
        return json(req, { error: "An invalid photo path was supplied." }, 400);
      }

      const { data: stored, error: listError } = await admin.storage
        .from(BUCKET)
        .list(bookingId, { limit: 100 });
      if (listError) throw listError;
      const storedNames = new Set((stored || []).map((item) => item.name));
      const complete = files.filter((file) => storedNames.has(file.path.split("/").pop() || ""));
      if (!complete.length) {
        return json(req, { error: "No completed photo uploads were found." }, 400);
      }

      const rows = complete.map((file) => ({
        booking_id: bookingId,
        storage_path: file.path,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      }));
      const { error: insertError } = await admin
        .from("booking_quote_photos")
        .upsert(rows, { onConflict: "storage_path", ignoreDuplicates: true });
      if (insertError) throw insertError;

      return json(req, { uploaded: rows.length });
    }

    return json(req, { error: "Unsupported photo action." }, 400);
  } catch (error) {
    console.error("upload-booking-photos", error);
    const message = error instanceof Error ? error.message : "Photo upload failed.";
    return json(req, { error: message }, 400);
  }
});

