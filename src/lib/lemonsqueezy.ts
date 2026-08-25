import "server-only";
import crypto from "crypto";
import type { PaymentType } from "@/types/database";

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

const VARIANT_ENV_KEYS: Record<PaymentType, string> = {
  boost: "LEMONSQUEEZY_BOOST_VARIANT_ID",
  revive: "LEMONSQUEEZY_REVIVE_VARIANT_ID",
  defend: "LEMONSQUEEZY_DEFEND_VARIANT_ID",
};

export function getVariantId(type: PaymentType): string {
  const key = VARIANT_ENV_KEYS[type];
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var ${key} — payments aren't configured yet.`);
  return value;
}

interface CreateCheckoutParams {
  variantId: string;
  custom: Record<string, string>;
  redirectUrl: string;
}

/**
 * Creates a LemonSqueezy checkout via their REST API and returns the
 * hosted checkout URL to hand to the client-side overlay. `custom` is
 * echoed back verbatim in the webhook payload under `meta.custom_data`,
 * which is how we correlate a confirmed payment back to a product/match.
 */
export async function createCheckout({
  variantId,
  custom,
  redirectUrl,
}: CreateCheckoutParams): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) {
    throw new Error("LemonSqueezy is not configured (missing API key or store id).");
  }

  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: { custom },
          product_options: { redirect_url: redirectUrl },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LemonSqueezy checkout creation failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { data?: { attributes?: { url?: string } } };
  const url = json.data?.attributes?.url;
  if (!url) throw new Error("LemonSqueezy did not return a checkout URL.");
  return url;
}

/**
 * Verifies the `X-Signature` header LemonSqueezy sends on every webhook
 * request: an HMAC-SHA256 hex digest of the *raw* request body using the
 * webhook signing secret. Must be checked against the raw body text, not
 * a re-serialized JSON object — re-serializing can change key order/
 * whitespace and produce a different digest.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signatureHeader, "hex"));
  } catch {
    return false;
  }
}
