import "server-only";
import crypto from "crypto";
import type { NextRequest } from "next/server";

export const FINGERPRINT_COOKIE = "arena_vid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Reads the visitor's id cookie, or generates a fresh one if absent. */
export function getOrCreateVisitorId(req: NextRequest): {
  id: string;
  isNew: boolean;
} {
  const existing = req.cookies.get(FINGERPRINT_COOKIE)?.value;
  if (existing) return { id: existing, isNew: false };
  return { id: crypto.randomUUID(), isNew: true };
}

/** One-way hash of the visitor id — this is what we store, never the raw id. */
export function hashFingerprint(visitorId: string): string {
  const salt = process.env.FINGERPRINT_SALT || "arena-dev-salt";
  return crypto.createHash("sha256").update(`${visitorId}:${salt}`).digest("hex");
}

export const fingerprintCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: ONE_YEAR_SECONDS,
  path: "/",
};

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "0.0.0.0";
}
