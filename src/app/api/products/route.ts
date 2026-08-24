import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getArenaState } from "@/lib/arena-state";
import { pairUnmatchedProducts, logActivity } from "@/lib/arena";
import { getClientIp } from "@/lib/fingerprint";
import { rateLimit } from "@/lib/rate-limit";
import { CATEGORIES, type Category } from "@/types/database";

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`submit:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many submissions. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, url, category, pitch } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return NextResponse.json({ error: "Product name is required (max 80 characters)." }, { status: 400 });
  }
  if (typeof pitch !== "string" || !pitch.trim() || pitch.trim().length > 140) {
    return NextResponse.json(
      { error: "One-line pitch is required (max 140 characters)." },
      { status: 400 },
    );
  }
  if (typeof category !== "string" || !CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (typeof url !== "string") {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return NextResponse.json({ error: "Please enter a valid URL." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: product, error } = await admin
    .from("products")
    .insert({
      name: name.trim(),
      url: normalizedUrl,
      pitch: pitch.trim(),
      category: category as Category,
      status: "active",
      wins: 0,
      is_defending: false,
    })
    .select()
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Could not submit product. Please try again." }, { status: 500 });
  }

  await logActivity(admin, `🆕 ${product.name} just entered the arena in ${category}`);
  await pairUnmatchedProducts(admin, category as Category);

  const state = await getArenaState(admin);
  return NextResponse.json({ product, state }, { status: 201 });
}
