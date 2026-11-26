import { createClient } from "@supabase/supabase-js";

/* Connection to Lumora's Supabase project. The URL and the publishable key are public by design:
   they ship in every browser, and what a visitor can read or change is decided by the database
   (row level security and the functions in supabase/migrations). The secret key never goes here. */

export const SUPABASE_URL = "https://ijynoxlgcpsckrepbyhw.supabase.co";
export const SUPABASE_KEY = "sb_publishable_dMc8GXjT0npb_myW76syYw_eFAU80nE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // the site uses hash routes (#/app...), so sign-in links come back with tokens in the hash
    flowType: "implicit",
    detectSessionInUrl: true,
  },
});
