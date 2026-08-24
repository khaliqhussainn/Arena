import "server-only";

/**
 * Best-effort in-memory rate limiter. Resets on cold start and is not
 * shared across serverless instances — good enough to blunt casual abuse
 * at MVP scale. The real anti-double-vote guarantee is the DB unique
 * constraint on (match_id, voter_fingerprint), not this.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 20_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
