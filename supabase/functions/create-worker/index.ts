import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const allowedOrigins = new Set([
  "https://senmoonbounce.com",
  "https://www.senmoonbounce.com",
]);

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
      ? origin
      : "https://www.senmoonbounce.com",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

function reply(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request),
  });
}

function optionalText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }

  if (request.method !== "POST") {
    return reply(request, { error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  if (!supabaseUrl || !serviceRoleKey || !token) {
    return reply(request, { error: "Unauthorized." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userResult, error: userError } =
    await admin.auth.getUser(token);
  const caller = userResult.user;

  if (userError || !caller) {
    return reply(request, { error: "Unauthorized." }, 401);
  }

  const { data: owner } = await admin
    .from("admin_users")
    .select("role, active")
    .eq("user_id", caller.id)
    .eq("active", true)
    .maybeSingle();

  if (!owner || !["OWNER", "ADMIN"].includes(String(owner.role))) {
    return reply(request, { error: "Owner or administrator access is required." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return reply(request, { error: "Invalid request." }, 400);
  }

  const firstName = optionalText(body.first_name);
  const lastName = optionalText(body.last_name);
  const email = optionalText(body.email)?.toLowerCase() ?? null;
  const password = typeof body.temporary_password === "string"
    ? body.temporary_password
    : "";

  if (!firstName || !lastName || !email) {
    return reply(request, { error: "First name, last name and email are required." }, 400);
  }

  if (password.length < 8) {
    return reply(request, { error: "Temporary password must contain at least 8 characters." }, 400);
  }

  const { data: existingWorker } = await admin
    .from("driver_profiles")
    .select("id, first_name, last_name, email")
    .ilike("email", email)
    .maybeSingle();

  if (existingWorker) {
    return reply(request, {
      success: true,
      already_exists: true,
      worker: existingWorker,
    });
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `${firstName} ${lastName}` },
    });

  if (createError || !created.user) {
    const duplicate = /already|registered|exists/i.test(createError?.message ?? "");
    return reply(
      request,
      { error: duplicate ? "A login already exists for this email." : "Worker login could not be created." },
      duplicate ? 409 : 400,
    );
  }

  const workerId = created.user.id;
  const profile = {
    id: workerId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: optionalText(body.phone),
    license_number: optionalText(body.license_number),
    vehicle_name: optionalText(body.vehicle_name),
    vehicle_plate: optionalText(body.vehicle_plate),
    notes: optionalText(body.notes),
    active: body.active !== false,
    available: body.available !== false,
  };

  const { error: profileError } = await admin
    .from("driver_profiles")
    .insert(profile);

  const { error: roleError } = await admin
    .from("admin_users")
    .insert({
      id: workerId,
      user_id: workerId,
      full_name: `${firstName} ${lastName}`,
      role: "DRIVER",
      active: body.active !== false,
      phone: optionalText(body.phone),
    });

  if (profileError || roleError) {
    await admin.from("driver_profiles").delete().eq("id", workerId);
    await admin.from("admin_users").delete().eq("id", workerId);
    await admin.auth.admin.deleteUser(workerId);
    return reply(request, { error: "Worker profile could not be created." }, 500);
  }

  return reply(request, {
    success: true,
    worker: { id: workerId, first_name: firstName, last_name: lastName, email },
  }, 201);
});
