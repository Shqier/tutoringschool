// ============================================
// AUTH0 SESSION UTILITIES
// ============================================

import { getSession as getAuth0Session, updateSession } from '@auth0/nextjs-auth0';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { Session, Auth0User } from './config';

/**
 * Get the current session from a Next.js API route or Server Component
 */
export async function getSession(req?: NextRequest): Promise<Session | null> {
  try {
    if (req) {
      // API route context
      const session = await getAuth0Session(req);
      return session as Session | null;
    } else {
      // Server Component context
      const session = await getAuth0Session();
      return session as Session | null;
    }
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user from session
 */
export async function getUser(req?: NextRequest): Promise<Auth0User | null> {
  const session = await getSession(req);
  return session?.user || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(req?: NextRequest): Promise<boolean> {
  const user = await getUser(req);
  return !!user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(req?: NextRequest): Promise<Auth0User> {
  const user = await getUser(req);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Get access token for API calls
 */
export async function getAccessToken(req?: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.accessToken || null;
}

/**
 * Update user metadata in session
 */
export async function updateUserMetadata(
  metadata: Record<string, unknown>,
  req?: NextRequest
): Promise<void> {
  const session = await getSession(req);
  
  if (!session) {
    throw new Error('No session found');
  }
  
  const updatedUser = {
    ...session.user,
    ...metadata,
  };
  
  if (req) {
    await updateSession(req, { ...session, user: updatedUser });
  }
}

/**
 * Get orgId from user session
 * Falls back to default org if not set
 */
export async function getOrgId(req?: NextRequest): Promise<string> {
  const user = await getUser(req);
  return user?.org_id || 'org_busala_default';
}
