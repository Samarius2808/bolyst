// Simple in-memory rate limiter — per serverless instance.
// Suitable for protecting against bursts from a single user.

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Clean up expired entries periodically to avoid memory growth.
function cleanup() {
  const now = Date.now();
  for (const [key, window] of store) {
    if (now >= window.resetAt) store.delete(key);
  }
}

/**
 * Returns true if the request should be allowed, false if rate limited.
 * @param key     Unique key, e.g. `scrape:${userId}`
 * @param limit   Max requests allowed per window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (store.size > 10_000) cleanup();

  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count++;
  return true;
}
