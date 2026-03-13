// Session Management for ClassHub
// Database-backed sessions with cookie storage

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { User, Session } from '@prisma/client';

// Session cookie name
const SESSION_COOKIE_NAME = 'busala_session';

// Session duration: 30 days
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

/**
 * Generate a cryptographically secure random token
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

/**
 * Hash a session token for database storage
 */
export function hashSessionToken(token: string): string {
  const tokenBytes = new TextEncoder().encode(token);
  const hashBytes = sha256(tokenBytes);
  return encodeHexLowerCase(hashBytes);
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ session: Session; token: string }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  return { session, token };
}

/**
 * Validate a session token and return session + user
 */
export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!session) {
    return { session: null, user: null };
  }

  // Check if session is expired
  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: session.id } });
    return { session: null, user: null };
  }

  // Extend session if it's close to expiring (rolling sessions)
  // Extend if less than 15 days remaining
  const fifteenDaysMs = 1000 * 60 * 60 * 24 * 15;
  if (Date.now() + fifteenDaysMs >= session.expiresAt.getTime()) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });
    session.expiresAt = newExpiresAt;
  }

  return { session, user: session.user };
}

/**
 * Invalidate a session by ID
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } });
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
    // Allow cookie to be shared across subdomains in production
    domain: process.env.NODE_ENV === 'production' ? '.classhub.io' : undefined,
  });
}

/**
 * Delete session cookie
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get session token from cookie
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Get current session and user (for server components)
 */
export async function getCurrentSession(): Promise<SessionValidationResult> {
  const token = await getSessionToken();
  if (!token) {
    return { session: null, user: null };
  }
  return validateSessionToken(token);
}

/**
 * Require authentication - throws or redirects if not authenticated
 */
export async function requireAuth(
  redirectTo: string = '/login'
): Promise<{ session: Session; user: User }> {
  const result = await getCurrentSession();
  if (!result.session || !result.user) {
    // Can't use redirect here in all contexts, return null and let caller handle
    throw new Error('Unauthorized');
  }
  return result as { session: Session; user: User };
}
