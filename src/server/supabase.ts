import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

// Create a Supabase client for server-side operations
// Only use this in server-side code (API routes, etc.)
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
);
