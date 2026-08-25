/**
 * Minimal fixed-window rate limiter for route handlers.
 *
 * Scope note: state lives in the memory of one serverless instance, so a burst spread
 * across instances gets a higher effective limit, and a cold start resets counters.
 * It is a brake on the obvious abuse (someone looping our provider-key-backed routes),
 * not a hard guarantee - that needs a shared store such as Upstash/Redis.
 */

type Bucket = { hits: number[]; };

const buckets = new Map<string, Bucket>();
let lastPrune = Date.now();

const PRUNE_INTERVAL_MS = 5 * 60 * 1000;

function prune(now: number, windowMs: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  const cutoff = now - Math.max(windowMs, PRUNE_INTERVAL_MS);
  for (const [key, bucket] of buckets) {
    const last = bucket.hits[bucket.hits.length - 1];
    if (last === undefined || last < cutoff) buckets.delete(key);
  }
  lastPrune = now;
}

/** Returns the caller's IP as reported by the platform proxy, or a shared fallback key. */
export function getClientIp(req: Request): string {
  // On Vercel these headers are set by the platform edge, not by the client.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  const hits = bucket.hits.filter((ts) => ts > now - windowMs);

  if (hits.length >= maxRequests) {
    buckets.set(key, { hits });
    return true;
  }

  hits.push(now);
  buckets.set(key, { hits });
  return false;
}
