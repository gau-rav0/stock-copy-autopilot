/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Uses a Map<string, number[]> to track request timestamps per key (IP).
 * Not shared across serverless instances — this is a best-effort guard,
 * not a bulletproof DDoS shield. For production scale, use Vercel's
 * edge middleware or an external store like Upstash Redis.
 */

const store = new Map<string, number[]>();

// Prevent the in-memory store from growing unbounded
const MAX_KEYS = 10_000;

function pruneOldEntries(windowMs: number) {
  if (store.size <= MAX_KEYS) return;
  const cutoff = Date.now() - windowMs;
  for (const [key, timestamps] of store) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) {
      store.delete(key);
    } else {
      store.set(key, fresh);
    }
  }
}

export function rateLimit(
  key: string,
  { windowMs = 60_000, maxRequests = 10 }: { windowMs?: number; maxRequests?: number } = {}
): { success: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  pruneOldEntries(windowMs);

  const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  return { success: true, remaining: maxRequests - timestamps.length };
}

export function getClientIp(request: Request): string {
  // Vercel overwrites this header before requests reach functions. Self-hosted
  // deployments must only trust it when their proxy strips client-supplied values.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
