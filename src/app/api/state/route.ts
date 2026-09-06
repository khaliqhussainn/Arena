import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getArenaState } from "@/lib/arena-state";
import { markStaleWaitingProductsUnique } from "@/lib/arena";

export async function GET() {
  const admin = createAdminSupabaseClient();
  await markStaleWaitingProductsUnique(admin);
  const state = await getArenaState(admin);
  return NextResponse.json(state);
}
