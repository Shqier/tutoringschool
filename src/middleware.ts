// ============================================
// AUTHENTICATION MIDDLEWARE
// Protects routes and manages session
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth',
  '/api/debug',
  '/_next',
  '/favicon.ico',
  '/static',
  '/images',
  '/fonts',
];

/**
 * Check if a path is public
 */
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((publicPath) =>
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
}

/**
 * Check if user has a valid session
 */
function hasSession(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get('appSession');
  if (!sessionCookie?.value) return false;
  
  try {
    const session = JSON.parse(sessionCookie.value);
    return !!session.user;
  } catch {
    return false;
  }
}

/**
 * Get user info from session
 */
function getUserFromSession(req: NextRequest) {
  const sessionCookie = req.cookies.get('appSession');
  if (!sessionCookie?.value) return null;
  
  try {
    const session = JSON.parse(sessionCookie.value);
    return session.user;
  } catch {
    return null;
  }
}

/**
 * Authentication middleware
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return res;
  }

  // Check if user is authenticated
  const user = getUserFromSession(req);

  if (!user) {
    // No session - redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add user info to headers for API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    res.headers.set('x-user-id', user.sub || user.email);
    res.headers.set('x-user-email', user.email);
    res.headers.set('x-user-role', user.role || 'staff');
    res.headers.set('x-org-id', user.org_id || 'org_busala_default');
  }

  return res;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
