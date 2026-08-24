import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Anon-key client for use in Client Components and Server Components alike.
 * Read-only in practice: RLS policies only grant SELECT to the anon role.
 */
export function createBrowserSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
