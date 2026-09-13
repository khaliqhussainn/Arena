/**
 * The site's own absolute base URL — used for LemonSqueezy checkout
 * redirects, share links, and the champion badge embed. Prefers the
 * explicit `NEXT_PUBLIC_SITE_URL` env var (set this in production), but
 * falls back to the ORIGIN OF THE ACTUAL INCOMING REQUEST rather than a
 * hardcoded string. A misconfigured/missing env var (e.g. still set to
 * "http://localhost:3000" after deploying) can then never silently send a
 * real visitor's browser to localhost — it just uses whatever host they
 * actually hit.
 */
export function resolveSiteUrl(requestOrigin?: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL || requestOrigin || "http://localhost:3000";
}
