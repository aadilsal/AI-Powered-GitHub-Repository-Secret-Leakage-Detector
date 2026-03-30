import { NextRequest } from 'next/server';
import { getRedis } from './redis';

type RateMap = { count: number; windowStart: number };

const MAP: Map<string, RateMap> = new Map();
const LIMIT = Number(process.env.RATE_LIMIT_MAX || 5);
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000);

function getClientKey(req: NextRequest) {
  const xf = req.headers.get('x-forwarded-for') || '';
  const ip = (xf.split(',')[0]?.trim() || req.ip || req.headers.get('x-real-ip') || 'unknown').toString();
  return ip || 'unknown';
}

export async function checkRateLimit(req: NextRequest) {
  try {
    const ip = getClientKey(req);
    const now = Date.now();

    const redis = getRedis();
    if (redis) {
      const key = `rl:v1:${ip}`;
      const ttlSec = Math.ceil(WINDOW_MS / 1000);

      // atomic-ish: INCR then ensure TTL exists
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSec);

      if (count > LIMIT) {
        const ttl = await redis.ttl(key);
        const retryAfter = Math.max(1, Number.isFinite(ttl) ? ttl : ttlSec);
        return { allowed: false, retryAfter };
      }

      return { allowed: true };
    }

    const state = MAP.get(ip) || { count: 0, windowStart: now };
    if (now - state.windowStart > WINDOW_MS) {
      state.count = 0;
      state.windowStart = now;
    }
    state.count += 1;
    MAP.set(ip, state);
    if (state.count > LIMIT) {
      return { allowed: false, retryAfter: Math.ceil((state.windowStart + WINDOW_MS - now) / 1000) };
    }
    return { allowed: true };
  } catch (e) {
    return { allowed: true };
  }
}
