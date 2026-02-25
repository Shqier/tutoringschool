import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, static files, and API routes (which have their own auth)
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For API routes, inject auth headers from cookie (backward compatible with header-based auth)
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('busala-session')?.value;
    if (token) {
      const user = await verifyToken(token);
      if (user) {
        const requestHeaders = new Headers(request.headers);
        if (!requestHeaders.has('x-user-role')) {
          requestHeaders.set('x-user-role', user.role);
        }
        if (!requestHeaders.has('x-user-id')) {
          requestHeaders.set('x-user-id', user.id);
        }
        if (!requestHeaders.has('x-org-id')) {
          requestHeaders.set('x-org-id', user.orgId);
        }
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    }
    return NextResponse.next();
  }

  // For app pages, check auth cookie
  const token = request.cookies.get('busala-session')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifyToken(token);
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
