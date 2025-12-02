import { NextRequest } from 'next/server';

type RateMap = { count: number; windowStart: number };

const MAP: Map<string, RateMap> = new Map();
const LIMIT = 5;
const WINDOW_MS = 60 * 1000;

export function checkRateLimit(req: NextRequest) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || req.ip || req.headers.get('x-real-ip') || 'unknown');
    const now = Date.now();
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
