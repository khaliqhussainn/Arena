import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getArenaState } from "@/lib/arena-state";

export async function GET() {
  const admin = createAdminSupabaseClient();
  const state = await getArenaState(admin);
  return NextResponse.json(state);
}
