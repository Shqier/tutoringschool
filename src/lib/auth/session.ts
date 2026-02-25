// ============================================
// AUTH0 SESSION UTILITIES
// ============================================

import type { NextRequest } from 'next/server';

/**
 * User info structure
 */
export interface Auth0User {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  org_id?: string;
  role?: string;
  db_id?: string;
  [key: string]: unknown;
}

/**
 * Session data structure
 */
export interface Session {
  user: Auth0User;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: number;
  createdAt: number;
}

/**
 * Get the current user from request headers (set by middleware)
 * This is used in API routes
 */
export async function getUserFromHeaders(request: Request): Promise<Auth0User | null> {
  // Headers are set by the auth middleware (src/middleware.ts)
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role');
  const orgId = request.headers.get('x-org-id');

  if (!userId || userId === 'anonymous') {
    return null;
  }

  return {
    sub: userId,
    email: userEmail || '',
    email_verified: true,
    role: userRole || 'staff',
    org_id: orgId || 'org_busala_default',
  };
}

/**
 * Check if user is authenticated from headers
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const userId = request.headers.get('x-user-id');
  return !!userId && userId !== 'anonymous';
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: Request): Promise<Auth0User> {
  const user = await getUserFromHeaders(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get orgId from request headers
 */
export function getOrgId(request: Request): string {
  return request.headers.get('x-org-id') || 'org_busala_default';
}
