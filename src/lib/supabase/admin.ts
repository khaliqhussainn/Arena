import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Service-role client. Bypasses RLS entirely — only ever import this from
 * server-side code (route handlers, server actions). Never expose the
 * service role key to the client.
 *
 * Use this to perform every write in the app: submissions, votes, match
 * resolution, and crediting paid actions after a LemonSqueezy webhook
 * confirms payment.
 */
export function createAdminSupabaseClient() {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
