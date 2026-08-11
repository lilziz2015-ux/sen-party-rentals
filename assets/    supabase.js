"use strict";

/* =========================================================
   SEN PARTY RENTALS — SUPABASE CONNECTION
   Project: tuttkwpnicgfcyeptrkv
========================================================= */

const SEN_SUPABASE_URL =
  "https://tuttkwpnicgfcyeptrkv.supabase.co";

const SEN_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_-I_Yvq8T9nR0rYyS2Gaa8g_oykh__B1";

/*
  The Supabase JavaScript library must load before this file:

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="./supabase.js"></script>
*/

if (!window.supabase) {
  throw new Error(
    "Supabase JavaScript library is missing. Load @supabase/supabase-js before supabase.js."
  );
}

window.senSupabase = window.supabase.createClient(
  SEN_SUPABASE_URL,
  SEN_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sen-party-rentals-auth"
    },

    global: {
      headers: {
        "X-Client-Info": "sen-party-rentals-website"
      }
    }
  }
);

window.SEN_SUPABASE_CONFIG = Object.freeze({
  url: SEN_SUPABASE_URL,
  storageBucket: "rental-images"
});

console.info(
  "Sen Party Rentals Supabase connection initialized."
);