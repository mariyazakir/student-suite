import { RateLimitError } from './errors';
import type { SubscriptionTier } from '@/lib/auth/jwt';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const DEFAULT_WINDOW_MS = 60_000;

const RATE_LIMITS: Record<string, Record<SubscriptionTier, RateLimitConfig>> = {
  'ai:improve': {
    free: { limit: 5, windowMs: DEFAULT_WINDOW_MS },
    pro: { limit: 20, windowMs: DEFAULT_WINDOW_MS },
    enterprise: { limit: 60, windowMs: DEFAULT_WINDOW_MS },
  },
  'ai:parse-job': {
    free: { limit: 6, windowMs: DEFAULT_WINDOW_MS },
    pro: { limit: 30, windowMs: DEFAULT_WINDOW_MS },
    enterprise: { limit: 120, windowMs: DEFAULT_WINDOW_MS },
  },
  'ai:improve-project': {
    free: { limit: 4, windowMs: DEFAULT_WINDOW_MS },
    pro: { limit: 15, windowMs: DEFAULT_WINDOW_MS },
    enterprise: { limit: 50, windowMs: DEFAULT_WINDOW_MS },
  },
  'scoring:ats': {
    free: { limit: 10, windowMs: DEFAULT_WINDOW_MS },
    pro: { limit: 40, windowMs: DEFAULT_WINDOW_MS },
    enterprise: { limit: 120, windowMs: DEFAULT_WINDOW_MS },
  },
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const getBucket = (key: string, windowMs: number) => {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    const bucket = { count: 0, resetAt };
    buckets.set(key, bucket);
    return bucket;
  }
  return existing;
};

export const getRateLimitConfig = (action: string, tier: SubscriptionTier): RateLimitConfig => {
  const config = RATE_LIMITS[action]?.[tier];
  if (config) {
    return config;
  }
  return { limit: 60, windowMs: DEFAULT_WINDOW_MS };
};

export const checkRateLimit = (
  key: string,
  config: RateLimitConfig
): RateLimitResult => {
  const bucket = getBucket(key, config.windowMs);
  if (bucket.count >= config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      reset: bucket.resetAt,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    limit: config.limit,
    remaining: Math.max(config.limit - bucket.count, 0),
    reset: bucket.resetAt,
  };
};

export const buildRateLimitHeaders = (result: RateLimitResult) => ({
  'X-RateLimit-Limit': result.limit.toString(),
  'X-RateLimit-Remaining': result.remaining.toString(),
  'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
});

export const enforceRateLimit = (
  key: string,
  action: string,
  tier: SubscriptionTier
) => {
  const config = getRateLimitConfig(action, tier);
  const result = checkRateLimit(key, config);
  if (!result.allowed) {
    throw new RateLimitError('Rate limit exceeded. Please wait and try again.');
  }
  return result;
};
