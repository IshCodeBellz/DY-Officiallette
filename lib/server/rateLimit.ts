// Very lightweight in-memory rate limiter (per process). For production, replace with Redis.
// Token bucket per key with refill on interval.
interface Bucket {
  tokens: number;
  updated: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  intervalMs: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: limit, updated: now };
  if (now - bucket.updated >= intervalMs) {
    bucket.tokens = limit;
    bucket.updated = now;
  }
  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

// Test-only helper to clear buckets between tests to avoid cross-test pollution
export function __resetRateLimitForTests() {
  buckets.clear();
}
