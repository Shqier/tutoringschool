// ============================================
// NEXT.JS MIDDLEWARE - Route protection
// Verifies session-token cookie on all page routes.
// Uses Web Crypto API (Edge-compatible).
// ============================================

import { NextRequest, NextResponse } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production';

/** Decode a base64url string to Uint8Array */
function fromBase64Url(str: string): Uint8Array {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return false;

    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const keyData = new TextEncoder().encode(AUTH_SECRET);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sig).buffer as ArrayBuffer,
      new TextEncoder().encode(data).buffer as ArrayBuffer
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(data)));
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes (they do their own auth), login page, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname === '/auth/login' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const valid = await verifyToken(token);
  if (!valid) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.set('session-token', '', { maxAge: 0, path: '/' });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
