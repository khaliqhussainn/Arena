import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getArenaState } from "@/lib/arena-state";
import { pairUnmatchedProducts, logActivity, autoAdvanceStaleWaitingProducts } from "@/lib/arena";
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
    u.protocol = "https:"; // normalize scheme so http/https variants dedupe as the same URL
    return u.toString();
  } catch {
    return null;
  }
}

const MIN_FILL_TIME_MS = 1200;

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

  const { name, url, category, pitch, website, renderedAt } = (body ?? {}) as Record<
    string,
    unknown
  >;

  // Honeypot: a real user never sees or fills this field.
  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ error: "Could not submit product. Please try again." }, { status: 400 });
  }
  // A form submitted faster than a human could plausibly fill it out.
  if (typeof renderedAt !== "number" || Date.now() - renderedAt < MIN_FILL_TIME_MS) {
    return NextResponse.json({ error: "Could not submit product. Please try again." }, { status: 400 });
  }

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

  const { data: existing } = await admin
    .from("products")
    .select("id")
    .ilike("url", normalizedUrl)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "This product has already been submitted to the arena." },
      { status: 409 },
    );
  }

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
  await autoAdvanceStaleWaitingProducts(admin);

  const state = await getArenaState(admin);
  return NextResponse.json({ product, state }, { status: 201 });
}
