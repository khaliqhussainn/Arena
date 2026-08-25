import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getArenaState } from "@/lib/arena-state";
import { resolveMatchIfComplete, autoAdvanceStaleWaitingProducts } from "@/lib/arena";
import {
  FINGERPRINT_COOKIE,
  fingerprintCookieOptions,
  getClientIp,
  getOrCreateVisitorId,
  hashFingerprint,
} from "@/lib/fingerprint";
import { rateLimit } from "@/lib/rate-limit";
import type { VoteSide } from "@/types/database";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`vote:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Slow down — too many votes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { matchId, side } = (body ?? {}) as Record<string, unknown>;
  if (typeof matchId !== "string" || (side !== "a" && side !== "b")) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  const { id: visitorId, isNew } = getOrCreateVisitorId(req);
  const voterHash = hashFingerprint(visitorId);

  const admin = createAdminSupabaseClient();

  const { data: match, error } = await admin.rpc("cast_vote", {
    p_match_id: matchId,
    p_fingerprint: voterHash,
    p_side: side as VoteSide,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already voted in this duel." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "This duel is no longer active." },
      { status: 400 },
    );
  }

  if (match) {
    await resolveMatchIfComplete(admin, match);
  }
  await autoAdvanceStaleWaitingProducts(admin);

  const state = await getArenaState(admin);
  const res = NextResponse.json({ state });
  if (isNew) {
    res.cookies.set(FINGERPRINT_COOKIE, visitorId, fingerprintCookieOptions);
  }
  return res;
}
