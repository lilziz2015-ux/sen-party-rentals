import { createClient } from "npm:@supabase/supabase-js@2";

/* =========================================================
   SEN PARTY RENTALS
   BOOKING EMAIL + OWNER SMS NOTIFICATION
========================================================= */

/* =========================================================
   ENVIRONMENT VARIABLES
========================================================= */

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL")?.trim() ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";

const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY")?.trim() ?? "";

const OWNER_EMAIL =
  Deno.env.get("OWNER_EMAIL")?.trim() ||
  "senmoonbounce@gmail.com";

const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL")?.trim() ||
  "Sen Party Rentals <onboarding@resend.dev>";

const TWILIO_ACCOUNT_SID =
  Deno.env.get("TWILIO_ACCOUNT_SID")?.trim() ?? "";

const TWILIO_AUTH_TOKEN =
  Deno.env.get("TWILIO_AUTH_TOKEN")?.trim() ?? "";

const TWILIO_PHONE_NUMBER =
  Deno.env.get("TWILIO_PHONE_NUMBER")?.trim() ?? "";

const OWNER_PHONE =
  Deno.env.get("OWNER_PHONE")?.trim() ||
  "+15717199575";

/* =========================================================
   SUPABASE ADMIN CLIENT
========================================================= */

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/* =========================================================
   CORS AND RESPONSE HEADERS
========================================================= */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS"
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json"
};

/* =========================================================
   TYPES
========================================================= */

type NotificationChannel =
  | "EMAIL"
  | "SMS";

type NotificationStatus =
  | "SENT"
  | "FAILED"
  | "SKIPPED";

type NotificationLog = {
  booking_id: string;
  customer_id: string | null;
  channel: NotificationChannel;
  notification_type: string;
  recipient: string;
  status: NotificationStatus;
  provider_message_id?: string | null;
  error_message?: string | null;
};

type EmailTemplateOptions = {
  title: string;
  introduction: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
  setupLocation: string;
  surfaceType: string;
  specialInstructions: string;
  itemRows: string;
  subtotal: number;
  agreementUrl: string;
};

/* =========================================================
   GENERAL HELPERS
========================================================= */

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: JSON_HEADERS
    }
  );
}

function errorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function escapeHtml(
  value: unknown
): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(
  value: unknown
): boolean {
  const email =
    String(value ?? "").trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatMoney(
  value: unknown
): string {
  const amount =
    Number(value ?? 0);

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD"
    }
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0
  );
}

function formatDate(
  value: unknown
): string {
  const rawValue =
    String(value ?? "").trim();

  if (!rawValue) {
    return "Not provided";
  }

  const date =
    new Date(`${rawValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  ).format(date);
}

function formatTime(
  value: unknown
): string {
  const rawValue =
    String(value ?? "").trim();

  if (!rawValue) {
    return "Not provided";
  }

  const timeParts =
    rawValue.split(":");

  const hour =
    Number(timeParts[0]);

  const minute =
    Number(timeParts[1]);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return rawValue;
  }

  const date =
    new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}

function joinAddress(
  parts: unknown[]
): string {
  return parts
    .map(part =>
      String(part ?? "").trim()
    )
    .filter(Boolean)
    .join(", ");
}

/* =========================================================
   RESEND EMAIL SENDER
========================================================= */

async function sendEmail(
  to: string[],
  subject: string,
  html: string
): Promise<Record<string, unknown>> {
  if (!RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY secret is missing."
    );
  }

  if (!FROM_EMAIL) {
    throw new Error(
      "FROM_EMAIL secret is missing."
    );
  }

  const validRecipients =
    to
      .map(email => email.trim())
      .filter(email =>
        isValidEmail(email)
      );

  if (!validRecipients.length) {
    throw new Error(
      "A valid email recipient was not provided."
    );
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${RESEND_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          from: FROM_EMAIL,
          to: validRecipients,
          subject,
          html
        })
      }
    );

  const responseText =
    await response.text();

  let result:
    Record<string, unknown>;

  try {
    result =
      responseText
        ? JSON.parse(responseText)
        : {};
  } catch {
    result = {
      raw_response: responseText
    };
  }

  if (!response.ok) {
    throw new Error(
      String(
        result.message ??
        result.error ??
        `Resend rejected the request with status ${response.status}.`
      )
    );
  }

  return result;
}

/* =========================================================
   TWILIO SMS SENDER
========================================================= */

function twilioIsConfigured(): boolean {
  return Boolean(
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_PHONE_NUMBER &&
    OWNER_PHONE
  );
}

async function sendSms(
  to: string,
  message: string
): Promise<Record<string, unknown>> {
  if (!TWILIO_ACCOUNT_SID) {
    throw new Error(
      "TWILIO_ACCOUNT_SID secret is missing."
    );
  }

  if (!TWILIO_AUTH_TOKEN) {
    throw new Error(
      "TWILIO_AUTH_TOKEN secret is missing."
    );
  }

  if (!TWILIO_PHONE_NUMBER) {
    throw new Error(
      "TWILIO_PHONE_NUMBER secret is missing."
    );
  }

  if (!to) {
    throw new Error(
      "SMS recipient is missing."
    );
  }

  const credentials =
    btoa(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
    );

  const formBody =
    new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: message
    });

  const response =
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Basic ${credentials}`,

          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body:
          formBody.toString()
      }
    );

  const responseText =
    await response.text();

  let result:
    Record<string, unknown>;

  try {
    result =
      responseText
        ? JSON.parse(responseText)
        : {};
  } catch {
    result = {
      raw_response: responseText
    };
  }

  if (!response.ok) {
    throw new Error(
      String(
        result.message ??
        result.error_message ??
        `Twilio rejected the request with status ${response.status}.`
      )
    );
  }

  return result;
}

/* =========================================================
   NOTIFICATION LOGGING
========================================================= */

async function saveNotificationLog(
  log: NotificationLog
): Promise<void> {
  try {
    const {
      error
    } =
      await supabaseAdmin
        .from("notification_logs")
        .insert(log);

    if (error) {
      console.error(
        "Notification log insert failed:",
        error
      );
    }
  } catch (error) {
    console.error(
      "Notification logging exception:",
      error
    );
  }
}

/* =========================================================
   EMAIL TEMPLATE
========================================================= */

function buildEmailLayout(
  options: EmailTemplateOptions
): string {
  const specialInstructionsSection =
    options.specialInstructions
      ? `
        <div
          style="
            margin-top:22px;
            padding:15px;
            border-radius:10px;
            background:#f7f7f8;
          "
        >
          <strong>
            Special instructions
          </strong>

          <p
            style="
              margin:8px 0 0;
              color:#555b66;
              line-height:1.6;
              white-space:pre-line;
            "
          >
            ${escapeHtml(options.specialInstructions)}
          </p>
        </div>
      `
      : "";

  const agreementSection =
    options.agreementUrl
      ? `
        <div
          style="
            margin-top:18px;
            padding:18px;
            border-radius:12px;
            text-align:center;
            background:#111216;
          "
        >
          <p style="margin:0 0 13px;color:#ffffff;line-height:1.5">
            Your personalized rental agreement is ready.
          </p>

          <a
            href="${escapeHtml(options.agreementUrl)}"
            style="
              display:inline-block;
              padding:13px 18px;
              border-radius:10px;
              color:#ffffff;
              background:#d90429;
              font-weight:800;
              text-decoration:none;
            "
          >
            Review &amp; Sign Agreement
          </a>
        </div>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>
          ${escapeHtml(options.title)}
        </title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f5f5f7;
          font-family:Arial,Helvetica,sans-serif;
          color:#202329;
        "
      >
        <div
          style="
            max-width:680px;
            margin:0 auto;
            padding:30px 16px;
          "
        >
          <div
            style="
              padding:24px;
              border-radius:16px 16px 0 0;
              color:#ffffff;
              background:#d90429;
            "
          >
            <p
              style="
                margin:0 0 7px;
                font-size:12px;
                font-weight:700;
                letter-spacing:1.5px;
                text-transform:uppercase;
                opacity:.9;
              "
            >
              Sen Party Rentals
            </p>

            <h1
              style="
                margin:0;
                font-size:26px;
                line-height:1.25;
              "
            >
              ${escapeHtml(options.title)}
            </h1>
          </div>

          <div
            style="
              padding:26px;
              border:1px solid #e5e7eb;
              border-top:0;
              border-radius:0 0 16px 16px;
              background:#ffffff;
            "
          >
            <p
              style="
                margin:0 0 22px;
                font-size:16px;
                line-height:1.65;
              "
            >
              ${escapeHtml(options.introduction)}
            </p>

            <div
              style="
                padding:16px;
                border-radius:12px;
                background:#fff1f3;
              "
            >
              <p style="margin:0">
                <strong>
                  Booking number:
                </strong>

                <span
                  style="
                    color:#d90429;
                    font-weight:800;
                  "
                >
                  ${escapeHtml(options.bookingNumber)}
                </span>
              </p>
            </div>

            ${agreementSection}

            <table
              role="presentation"
              style="
                width:100%;
                margin-top:22px;
                border-collapse:collapse;
              "
            >
              <tbody>
                <tr>
                  <td
                    style="
                      width:145px;
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Customer
                  </td>

                  <td
                    style="
                      padding:8px 0;
                      font-weight:700;
                    "
                  >
                    ${escapeHtml(options.customerName)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Phone
                  </td>

                  <td style="padding:8px 0">
                    ${escapeHtml(options.customerPhone)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Email
                  </td>

                  <td style="padding:8px 0">
                    ${escapeHtml(options.customerEmail)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Event type
                  </td>

                  <td style="padding:8px 0">
                    ${escapeHtml(options.eventType)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Event date
                  </td>

                  <td style="padding:8px 0">
                    ${escapeHtml(options.eventDate)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Event time
                  </td>

                  <td style="padding:8px 0">
                    ${escapeHtml(options.eventTime)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Address
                  </td>

                  <td style="padding:8px 0">
                    ${escapeHtml(options.eventAddress)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                      vertical-align:top;
                    "
                  >
                    Setup
                  </td>

                  <td style="padding:8px 0">
                    ${escapeHtml(options.setupLocation)}
                    /
                    ${escapeHtml(options.surfaceType)}
                  </td>
                </tr>
              </tbody>
            </table>

            <table
              role="presentation"
              style="
                width:100%;
                margin-top:24px;
                border-collapse:collapse;
              "
            >
              <thead>
                <tr>
                  <th
                    style="
                      padding:11px;
                      text-align:left;
                      background:#111216;
                      color:#ffffff;
                    "
                  >
                    Rental
                  </th>

                  <th
                    style="
                      padding:11px;
                      text-align:center;
                      background:#111216;
                      color:#ffffff;
                    "
                  >
                    Qty
                  </th>

                  <th
                    style="
                      padding:11px;
                      text-align:right;
                      background:#111216;
                      color:#ffffff;
                    "
                  >
                    Price
                  </th>
                </tr>
              </thead>

              <tbody>
                ${options.itemRows}
              </tbody>
            </table>

            <p
              style="
                margin:24px 0 0;
                font-size:18px;
              "
            >
              <strong>
                Estimated subtotal:
              </strong>

              <span
                style="
                  color:#d90429;
                  font-weight:800;
                "
              >
                ${formatMoney(options.subtotal)}
              </span>
            </p>

            ${specialInstructionsSection}

            <p
              style="
                margin-top:25px;
                color:#6b7280;
                font-size:14px;
                line-height:1.65;
              "
            >
              This is a booking request. The reservation is not
              confirmed until Sen Party Rentals verifies availability,
              delivery information and final pricing.
            </p>

            <p
              style="
                margin:22px 0 0;
                line-height:1.6;
              "
            >
              <strong>
                Sen Party Rentals
              </strong>
              <br>

              (571) 719-9575
              <br>

              senmoonbounce@gmail.com
              <br>

              www.senmoonbounce.com
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/* =========================================================
   MAIN EDGE FUNCTION
========================================================= */

Deno.serve(
  async (
    request: Request
  ): Promise<Response> => {
    if (request.method === "OPTIONS") {
      return new Response(
        "ok",
        {
          status: 200,
          headers: CORS_HEADERS
        }
      );
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error: "Method not allowed."
        },
        405
      );
    }

    try {
      /* =====================================================
         VALIDATE REQUIRED SERVER SECRETS
      ===================================================== */

      if (!SUPABASE_URL) {
        throw new Error(
          "SUPABASE_URL environment variable is missing."
        );
      }

      if (!SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
          "SUPABASE_SERVICE_ROLE_KEY environment variable is missing."
        );
      }

      if (!RESEND_API_KEY) {
        throw new Error(
          "RESEND_API_KEY environment variable is missing."
        );
      }

      if (!isValidEmail(OWNER_EMAIL)) {
        throw new Error(
          "OWNER_EMAIL is missing or invalid."
        );
      }

      /* =====================================================
         READ REQUEST
      ===================================================== */

      let payload:
        Record<string, any>;

      try {
        payload =
          await request.json();
      } catch {
        throw new Error(
          "The request body must contain valid JSON."
        );
      }

      const incomingBooking =
        payload.record ??
        payload.booking ??
        payload;

      const bookingId =
        incomingBooking?.id ??
        incomingBooking?.booking_id ??
        payload.booking_id;

      if (!bookingId) {
        throw new Error(
          "No booking ID was included in the request."
        );
      }

      /* =====================================================
         LOAD BOOKING
      ===================================================== */

      const {
        data: bookingData,
        error: bookingError
      } =
        await supabaseAdmin
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

      if (bookingError) {
        throw new Error(
          `Booking lookup failed: ${bookingError.message}`
        );
      }

      if (!bookingData) {
        throw new Error(
          "Booking could not be found."
        );
      }

      /* =====================================================
         LOAD CUSTOMER
      ===================================================== */

      if (!bookingData.customer_id) {
        throw new Error(
          "The booking does not have a customer_id."
        );
      }

      const {
        data: customer,
        error: customerError
      } =
        await supabaseAdmin
          .from("customers")
          .select("*")
          .eq(
            "id",
            bookingData.customer_id
          )
          .single();

      if (customerError) {
        throw new Error(
          `Customer lookup failed: ${customerError.message}`
        );
      }

      if (!customer) {
        throw new Error(
          "Customer could not be found."
        );
      }

      /* =====================================================
         LOAD BOOKING ITEMS
      ===================================================== */

      const {
        data: bookingItems,
        error: itemsError
      } =
        await supabaseAdmin
          .from("booking_items")
          .select("*")
          .eq(
            "booking_id",
            bookingId
          )
          .order(
            "created_at",
            {
              ascending: true
            }
          );

      if (itemsError) {
        throw new Error(
          `Booking item lookup failed: ${itemsError.message}`
        );
      }

      const items =
        bookingItems ?? [];

      const {
        data: agreementRecord
      } =
        await supabaseAdmin
          .from("rental_agreements")
          .select("access_token")
          .eq("booking_id", bookingId)
          .maybeSingle();

      const agreementUrl =
        agreementRecord?.access_token
          ? `https://www.senmoonbounce.com/rental-agreement.html?token=${encodeURIComponent(String(agreementRecord.access_token))}`
          : "";

      /* =====================================================
         PREPARE CUSTOMER INFORMATION
      ===================================================== */

      const firstName =
        String(
          customer.first_name ??
          ""
        ).trim();

      const lastName =
        String(
          customer.last_name ??
          ""
        ).trim();

      const customerName =
        [firstName, lastName]
          .filter(Boolean)
          .join(" ") ||
        String(
          customer.name ??
          "Customer"
        ).trim() ||
        "Customer";

      const customerEmailAddress =
        String(
          customer.email ??
          ""
        )
          .trim()
          .toLowerCase();

      const customerPhone =
        String(
          customer.phone ??
          "Not provided"
        ).trim();

      /* =====================================================
         PREPARE BOOKING INFORMATION
      ===================================================== */

      const bookingNumber =
        String(
          bookingData.booking_number ??
          bookingData.id
        );

      const eventAddress =
        joinAddress([
          bookingData.event_address,
          bookingData.event_city,
          bookingData.event_state,
          bookingData.event_zip
        ]) ||
        "Not provided";

      const formattedStartTime =
        formatTime(
          bookingData.start_time
        );

      const formattedEndTime =
        formatTime(
          bookingData.end_time
        );

      const eventTime =
        formattedStartTime === "Not provided" &&
        formattedEndTime === "Not provided"
          ? "Not provided"
          : `${formattedStartTime} – ${formattedEndTime}`;

      const subtotal =
        Number(
          bookingData.subtotal ??
          bookingData.rental_subtotal ??
          bookingData.final_total ??
          bookingData.total ??
          0
        );

      /* =====================================================
         PREPARE ITEM ROWS
      ===================================================== */

      const itemRows =
        items.length
          ? items
              .map(item => {
                const quantity =
                  Number(
                    item.quantity ??
                    1
                  );

                const unitPrice =
                  Number(
                    item.unit_price ??
                    item.price ??
                    0
                  );

                const lineTotal =
                  Number(
                    item.line_total ??
                    item.subtotal ??
                    quantity * unitPrice
                  );

                const itemName =
                  String(
                    item.item_name ??
                    item.name ??
                    item.inventory_name ??
                    "Rental item"
                  );

                return `
                  <tr>
                    <td
                      style="
                        padding:11px;
                        border-bottom:1px solid #eeeeee;
                      "
                    >
                      ${escapeHtml(itemName)}
                    </td>

                    <td
                      style="
                        padding:11px;
                        border-bottom:1px solid #eeeeee;
                        text-align:center;
                      "
                    >
                      ${escapeHtml(quantity)}
                    </td>

                    <td
                      style="
                        padding:11px;
                        border-bottom:1px solid #eeeeee;
                        text-align:right;
                      "
                    >
                      ${formatMoney(lineTotal)}
                    </td>
                  </tr>
                `;
              })
              .join("")
          : `
              <tr>
                <td
                  colspan="3"
                  style="
                    padding:14px;
                    border-bottom:1px solid #eeeeee;
                    text-align:center;
                    color:#6b7280;
                  "
                >
                  No rental items were found.
                </td>
              </tr>
            `;

      const rentalNames =
        items
          .map(item => {
            const quantity =
              Number(
                item.quantity ??
                1
              );

            const itemName =
              String(
                item.item_name ??
                item.name ??
                item.inventory_name ??
                "Rental item"
              );

            return quantity > 1
              ? `${quantity}x ${itemName}`
              : itemName;
          })
          .join(", ");

      const emailTemplateOptions = {
        bookingNumber,
        customerName,
        customerPhone,

        customerEmail:
          customerEmailAddress ||
          "Not provided",

        eventType:
          String(
            bookingData.event_type ??
            "Not provided"
          ),

        eventDate:
          formatDate(
            bookingData.event_date
          ),

        eventTime,
        eventAddress,

        setupLocation:
          String(
            bookingData.setup_location ??
            "Not provided"
          ),

        surfaceType:
          String(
            bookingData.surface_type ??
            "Not provided"
          ),

        specialInstructions:
          String(
            bookingData.special_instructions ??
            bookingData.notes ??
            ""
          ),

        itemRows,
        subtotal,
        agreementUrl
      };

      /* =====================================================
         SEND OWNER EMAIL
      ===================================================== */

      let ownerEmailSent =
        false;

      let ownerEmailId:
        string | null = null;

      let ownerEmailError:
        string | null = null;

      try {
        const ownerEmailResult =
          await sendEmail(
            [OWNER_EMAIL],

            `New booking request ${bookingNumber}`,

            buildEmailLayout({
              ...emailTemplateOptions,

              title:
                "New Booking Request",

              introduction:
                `${customerName} submitted a new booking request.`
            })
          );

        ownerEmailSent =
          true;

        ownerEmailId =
          String(
            ownerEmailResult.id ??
            ""
          ) || null;

        await saveNotificationLog({
          booking_id:
            String(bookingId),

          customer_id:
            String(
              bookingData.customer_id
            ),

          channel:
            "EMAIL",

          notification_type:
            "BOOKING_REQUEST_OWNER",

          recipient:
            OWNER_EMAIL,

          status:
            "SENT",

          provider_message_id:
            ownerEmailId
        });
      } catch (error) {
        ownerEmailError =
          errorMessage(error);

        console.error(
          "Owner email failed:",
          error
        );

        await saveNotificationLog({
          booking_id:
            String(bookingId),

          customer_id:
            String(
              bookingData.customer_id
            ),

          channel:
            "EMAIL",

          notification_type:
            "BOOKING_REQUEST_OWNER",

          recipient:
            OWNER_EMAIL,

          status:
            "FAILED",

          provider_message_id:
            null,

          error_message:
            ownerEmailError
        });
      }

      /* =====================================================
         SEND CUSTOMER EMAIL
      ===================================================== */

      let customerEmailSent =
        false;

      let customerEmailId:
        string | null = null;

      let customerEmailError:
        string | null = null;

      if (!customerEmailAddress) {
        customerEmailError =
          "Customer email address is missing.";

        await saveNotificationLog({
          booking_id:
            String(bookingId),

          customer_id:
            String(
              bookingData.customer_id
            ),

          channel:
            "EMAIL",

          notification_type:
            "BOOKING_REQUEST_CUSTOMER",

          recipient:
            "Not provided",

          status:
            "SKIPPED",

          provider_message_id:
            null,

          error_message:
            customerEmailError
        });
      } else if (
        !isValidEmail(
          customerEmailAddress
        )
      ) {
        customerEmailError =
          "Customer email address is invalid.";

        await saveNotificationLog({
          booking_id:
            String(bookingId),

          customer_id:
            String(
              bookingData.customer_id
            ),

          channel:
            "EMAIL",

          notification_type:
            "BOOKING_REQUEST_CUSTOMER",

          recipient:
            customerEmailAddress,

          status:
            "FAILED",

          provider_message_id:
            null,

          error_message:
            customerEmailError
        });
      } else {
        try {
          const customerEmailResult =
            await sendEmail(
              [customerEmailAddress],

              `We received your booking request ${bookingNumber}`,

              buildEmailLayout({
                ...emailTemplateOptions,

                title:
                  "Booking Request Received",

                introduction:
                  `Thank you ${firstName || customerName}. We received your booking request and will contact you to confirm availability, delivery pricing and the final total.`
              })
            );

          customerEmailSent =
            true;

          customerEmailId =
            String(
              customerEmailResult.id ??
              ""
            ) || null;

          await saveNotificationLog({
            booking_id:
              String(bookingId),

            customer_id:
              String(
                bookingData.customer_id
              ),

            channel:
              "EMAIL",

            notification_type:
              "BOOKING_REQUEST_CUSTOMER",

            recipient:
              customerEmailAddress,

            status:
              "SENT",

            provider_message_id:
              customerEmailId
          });
        } catch (error) {
          customerEmailError =
            errorMessage(error);

          console.error(
            "Customer email failed:",
            error
          );

          await saveNotificationLog({
            booking_id:
              String(bookingId),

            customer_id:
              String(
                bookingData.customer_id
              ),

            channel:
              "EMAIL",

            notification_type:
              "BOOKING_REQUEST_CUSTOMER",

            recipient:
              customerEmailAddress,

            status:
              "FAILED",

            provider_message_id:
              null,

            error_message:
              customerEmailError
          });
        }
      }

      /* =====================================================
         SEND OWNER SMS
      ===================================================== */

      let ownerSmsSent =
        false;

      let ownerSmsId:
        string | null = null;

      let ownerSmsError:
        string | null = null;

      if (!twilioIsConfigured()) {
        ownerSmsError =
          "Twilio SMS secrets are not fully configured.";

        await saveNotificationLog({
          booking_id:
            String(bookingId),

          customer_id:
            String(
              bookingData.customer_id
            ),

          channel:
            "SMS",

          notification_type:
            "BOOKING_REQUEST_OWNER",

          recipient:
            OWNER_PHONE,

          status:
            "SKIPPED",

          provider_message_id:
            null,

          error_message:
            ownerSmsError
        });
      } else {
        const ownerSmsMessage =
          [
            `NEW BOOKING ${bookingNumber}`,

            `Customer: ${customerName}`,

            `Phone: ${customerPhone}`,

            `Date: ${formatDate(
              bookingData.event_date
            )}`,

            `Time: ${eventTime}`,

            `Rentals: ${
              rentalNames ||
              "See booking details"
            }`,

            `Subtotal: ${formatMoney(
              subtotal
            )}`,

            `Address: ${eventAddress}`
          ].join("\n");

        try {
          const ownerSmsResult =
            await sendSms(
              OWNER_PHONE,
              ownerSmsMessage
            );

          ownerSmsSent =
            true;

          ownerSmsId =
            String(
              ownerSmsResult.sid ??
              ""
            ) || null;

          await saveNotificationLog({
            booking_id:
              String(bookingId),

            customer_id:
              String(
                bookingData.customer_id
              ),

            channel:
              "SMS",

            notification_type:
              "BOOKING_REQUEST_OWNER",

            recipient:
              OWNER_PHONE,

            status:
              "SENT",

            provider_message_id:
              ownerSmsId
          });
        } catch (error) {
          ownerSmsError =
            errorMessage(error);

          console.error(
            "Owner SMS failed:",
            error
          );

          await saveNotificationLog({
            booking_id:
              String(bookingId),

            customer_id:
              String(
                bookingData.customer_id
              ),

            channel:
              "SMS",

            notification_type:
              "BOOKING_REQUEST_OWNER",

            recipient:
              OWNER_PHONE,

            status:
              "FAILED",

            provider_message_id:
              null,

            error_message:
              ownerSmsError
          });
        }
      }

      /* =====================================================
         RETURN RESULT
      ===================================================== */

      const atLeastOneNotificationSent =
        ownerEmailSent ||
        customerEmailSent ||
        ownerSmsSent;

      return jsonResponse(
        {
          success:
            atLeastOneNotificationSent,

          booking_id:
            String(bookingId),

          booking_number:
            bookingNumber,

          owner_email_sent:
            ownerEmailSent,

          owner_email_id:
            ownerEmailId,

          owner_email_error:
            ownerEmailError,

          customer_email_recipient:
            customerEmailAddress ||
            null,

          customer_email_sent:
            customerEmailSent,

          customer_email_id:
            customerEmailId,

          customer_email_error:
            customerEmailError,

          owner_sms_sent:
            ownerSmsSent,

          owner_sms_id:
            ownerSmsId,

          owner_sms_error:
            ownerSmsError
        },
        atLeastOneNotificationSent
          ? 200
          : 500
      );
    } catch (error) {
      const message =
        errorMessage(error);

      console.error(
        "Booking notification function failed:",
        error
      );

      return jsonResponse(
        {
          success: false,
          error: message
        },
        500
      );
    }
  }
);
