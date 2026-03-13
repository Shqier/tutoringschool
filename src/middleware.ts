// ============================================
// BUSALA MULTI-TENANT MIDDLEWARE
// ============================================
// Handles authentication, tenant resolution, and route protection
// NOTE: This runs in Edge Runtime - cannot use Node.js APIs like Prisma

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Only import from types.ts which is safe for Edge Runtime
import {
  isSuperAdminHost,
  extractSubdomain,
  TenantContext,
} from '@/lib/tenant/types';

// ============================================
// PUBLIC PATHS
// ============================================

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/features',
  '/pricing',
  '/contact',
  '/api/auth',
  '/api/webhooks',
  '/api/debug',
  '/_next',
  '/favicon.ico',
  '/static',
  '/images',
  '/fonts',
];

// Superadmin-only paths
const SUPERADMIN_PATHS = ['/superadmin'];

// API paths that don't require auth
const PUBLIC_API_PATHS = ['/api/auth', '/api/webhooks', '/api/debug', '/api/tenants', '/api/onboarding'];

// ============================================
// HELPERS
// ============================================

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((publicPath) =>
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
}

function isPublicApiPath(path: string): boolean {
  return PUBLIC_API_PATHS.some((apiPath) => path.startsWith(apiPath));
}

function isSuperAdminPath(path: string): boolean {
  return SUPERADMIN_PATHS.some((adminPath) =>
    path === adminPath || path.startsWith(`${adminPath}/`)
  );
}

function hasValidSession(req: NextRequest): boolean {
  // Check for our custom session cookie
  const sessionCookie = req.cookies.get('busala_session');
  return !!sessionCookie?.value;
}

function getUserFromSession(req: NextRequest): { id?: string; email?: string; role?: string } | null {
  // Middleware only checks cookie existence - actual validation happens in API routes
  // This is because middleware runs in Edge Runtime and can't access DB
  const sessionCookie = req.cookies.get('busala_session');
  if (!sessionCookie?.value) return null;
  
  // Return minimal info - API routes will validate and get full user details
  return { id: '', email: '', role: '' };
}

/**
 * Resolve tenant from request - simplified version for Edge Runtime
 * Does NOT use Prisma - only extracts tenant info from headers/subdomain
 */
function resolveTenantFromRequest(
  hostname: string,
  headers: Headers
): TenantContext {
  // Check for superadmin host first
  if (isSuperAdminHost(hostname)) {
    return {
      tenant: null,
      tenantId: null,
      isSuperAdmin: true,
    };
  }
  
  // Try header first
  const headerTenantId = headers.get('x-tenant-id');
  if (headerTenantId) {
    return {
      tenant: null, // Will be validated by API routes
      tenantId: headerTenantId,
      isSuperAdmin: false,
    };
  }
  
  // Try subdomain
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    // Note: We don't look up the tenant in DB here (Edge Runtime limitation)
    // The API routes will validate the tenant exists and is active
    return {
      tenant: null,
      tenantId: null, // Will be resolved by API routes
      isSuperAdmin: false,
    };
  }
  
  // No tenant found
  return {
    tenant: null,
    tenantId: null,
    isSuperAdmin: false,
  };
}

// ============================================
// MAIN MIDDLEWARE
// ============================================

export async function middleware(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;
  
  // Create response to modify headers
  const res = NextResponse.next();
  
  // ============================================
  // 1. RESOLVE TENANT (Edge-safe version)
  // ============================================
  const tenantContext = resolveTenantFromRequest(hostname, req.headers);
  
  // Add tenant context to headers for downstream use
  if (tenantContext.tenantId) {
    res.headers.set('x-tenant-id', tenantContext.tenantId);
  }
  res.headers.set('x-is-superadmin', tenantContext.isSuperAdmin ? 'true' : 'false');
  
  // ============================================
  // 2. HANDLE SUPERADMIN ROUTES
  // ============================================
  if (isSuperAdminPath(pathname)) {
    // Superadmin routes require superadmin host or explicit override
    if (!tenantContext.isSuperAdmin && !req.headers.get('x-superadmin-override')) {
      // Redirect to main site if trying to access superadmin on tenant subdomain
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Check superadmin session
    const sessionCookie = req.cookies.get('superadminSession');
    if (!sessionCookie?.value && pathname !== '/superadmin/login') {
      return NextResponse.redirect(new URL('/superadmin/login', req.url));
    }
    
    return res;
  }
  
  // ============================================
  // 3. ALLOW PUBLIC PATHS
  // ============================================
  if (isPublicPath(pathname)) {
    return res;
  }
  
  // ============================================
  // 4. ALLOW PUBLIC API PATHS
  // ============================================
  if (isPublicApiPath(pathname)) {
    return res;
  }
  
  // ============================================
  // 5. CHECK AUTHENTICATION
  // ============================================
  const user = getUserFromSession(req);
  
  if (!user) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Page routes redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // ============================================
  // 6. ADD USER CONTEXT TO HEADERS
  // ============================================
  res.headers.set('x-user-id', user.id || '');
  res.headers.set('x-user-email', user.email || '');
  res.headers.set('x-user-role', user.role || 'staff');
  
  return res;
}

// ============================================
// MIDDLEWARE CONFIG
// ============================================

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\..*).*)',
  ],
};
