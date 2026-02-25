// ============================================
// AUTHENTICATION MIDDLEWARE
// Protects routes and manages session
// ============================================

import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth',
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
 * Authentication middleware
 * - Protects all routes except public paths
 * - Adds user info to headers for API routes
 * - Handles session validation
 */
export default withMiddlewareAuthRequired(async (req: NextRequest) => {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return res;
  }

  try {
    // Get session
    const session = await getSession(req, res);

    if (!session?.user) {
      // No session - redirect to login
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      res.headers.set('x-user-id', session.user.sub);
      res.headers.set('x-user-email', session.user.email);
      res.headers.set('x-user-role', session.user.role || 'staff');
      res.headers.set('x-org-id', session.user.org_id || 'org_busala_default');
    }

    return res;
  } catch (error) {
    console.error('[Middleware] Auth error:', error);
    
    // On error, redirect to login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
});

/**
 * Middleware configuration
 * Matches all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
