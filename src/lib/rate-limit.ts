import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = {
  hits: number;
  resetAt: number;
};

type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

const localBuckets = new Map<string, Bucket>();

const upstashRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const ratelimiters = new Map<string, Ratelimit>();

function getRatelimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!upstashRedis) return null;
  const key = `${limit}:${windowMs}`;
  const cached = ratelimiters.get(key);
  if (cached) return cached;

  const rl = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: "@fintech-wow",
  });
  ratelimiters.set(key, rl);
  return rl;
}

function localRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const bucket = localBuckets.get(input.key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + input.windowMs;
    localBuckets.set(input.key, { hits: 1, resetAt });
    return { ok: true, remaining: input.limit - 1, resetAt };
  }

  if (bucket.hits >= input.limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.hits += 1;
  return {
    ok: true,
    remaining: Math.max(0, input.limit - bucket.hits),
    resetAt: bucket.resetAt,
  };
}

export async function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const rl = getRatelimiter(input.limit, input.windowMs);
  if (!rl) return localRateLimit(input);

  const res = await rl.limit(input.key);
  return { ok: res.success, remaining: res.remaining, resetAt: res.reset };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
