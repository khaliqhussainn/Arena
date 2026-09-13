import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";
import { applyBoost, applyDefend, applyRevive } from "@/lib/arena";
import type { PaymentType } from "@/types/database";

interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string>;
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      total?: number;
    };
  };
}

/**
 * The single source of truth for granting a paid action: we only ever
 * apply a boost/revive/defend here, after verifying LemonSqueezy's
 * signature on the raw body and confirming the order is paid.
 *
 * Idempotency + retry-safety: a payment row is inserted as "pending"
 * BEFORE the grant is applied, and only flipped to "completed" AFTER it
 * succeeds. If applying the grant throws (a transient DB error, a bad RPC
 * call, etc.), this handler returns a non-2xx status so LemonSqueezy
 * retries the delivery — and the retry finds the existing "pending" row
 * and tries applying the grant again, rather than treating the order as
 * already handled. A "completed" row is the only thing that short-circuits
 * a redelivery. This is what actually failed before: the payment was
 * inserted as "completed" up front, so when applying the grant silently
 * failed (a discarded Supabase error), the payment looked processed
 * forever and no retry could ever fix it.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const status = payload.data?.attributes?.status;
  const orderId = payload.data?.id;
  const custom = payload.meta?.custom_data;

  // Only act on a confirmed, paid order carrying the custom data our
  // checkout attached. Anything else (test pings, other event types,
  // unpaid orders) is acknowledged with 200 but ignored.
  if (eventName !== "order_created" || status !== "paid" || !orderId || !custom) {
    return NextResponse.json({ received: true });
  }

  const type = custom.type as PaymentType | undefined;
  const productId = custom.product_id;
  const matchId = custom.match_id;

  if (!type || !productId || (type !== "boost" && type !== "revive" && type !== "defend")) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminSupabaseClient();

  const { data: existing, error: existingError } = await admin
    .from("payments")
    .select("status")
    .eq("lemonsqueezy_order_id", orderId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Could not look up payment." }, { status: 500 });
  }
  if (existing?.status === "completed") {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  if (!existing) {
    const { error: insertError } = await admin.from("payments").insert({
      lemonsqueezy_order_id: orderId,
      product_id: productId,
      match_id: matchId ?? null,
      type,
      amount: payload.data?.attributes?.total ?? null,
      status: "pending",
    });
    // 23505 = unique_violation on lemonsqueezy_order_id: a concurrent
    // delivery of this same event just inserted it — fall through and
    // apply the grant here (or let that other request's own attempt do
    // it); either way it's safely gated by the "completed" check above.
    if (insertError && insertError.code !== "23505") {
      return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
    }
  }

  const { data: product, error: productError } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (productError) {
    return NextResponse.json({ error: "Could not load product." }, { status: 500 });
  }
  if (!product) return NextResponse.json({ received: true });

  try {
    if (type === "boost" && matchId) {
      await applyBoost(admin, matchId, productId);
    } else if (type === "revive") {
      await applyRevive(admin, product);
    } else if (type === "defend") {
      await applyDefend(admin, product);
    }
  } catch (err) {
    console.error("Failed to apply LemonSqueezy payment grant", {
      orderId,
      type,
      productId,
      matchId,
      err,
    });
    // Left as "pending" on purpose — see the retry-safety note above.
    return NextResponse.json({ error: "Could not apply payment." }, { status: 500 });
  }

  await admin.from("payments").update({ status: "completed" }).eq("lemonsqueezy_order_id", orderId);

  return NextResponse.json({ received: true });
}
