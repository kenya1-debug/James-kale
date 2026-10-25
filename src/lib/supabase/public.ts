import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Cookie-less, read-only client for PUBLIC content (published pages, settings).
 * Because it never touches cookies(), pages that use it can be statically generated
 * and revalidated (ISR). RLS limits it to published rows.
 */
export const supabasePublic = createClient(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);
