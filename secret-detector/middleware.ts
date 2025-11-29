import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from './lib/rateLimit';

// Middleware to enforce rate limiting for scan endpoints
export function middleware(request: NextRequest) {
  try {
    // Only apply to API scan endpoints (matcher will scope this, but keep safe-check)
    const pathname = request.nextUrl.pathname || '';
    if (!pathname.startsWith('/api/scan-')) return NextResponse.next();

    const rl = checkRateLimit(request as any);
    if (!rl.allowed) {
      const retry = rl.retryAfter ?? 60;
      const res = NextResponse.json({ error: `Rate limit exceeded, retry after ${retry}s` }, { status: 429 });
      res.headers.set('Retry-After', String(retry));
      return res;
    }

    return NextResponse.next();
  } catch (e) {
    // On error, allow the request (fail-open) but log to console
    // eslint-disable-next-line no-console
    console.warn('Rate limit middleware error, allowing request', e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/api/scan-url', '/api/scan-upload'],
};
