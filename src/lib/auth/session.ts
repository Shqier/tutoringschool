// Session Management for Busala
// Database-backed sessions with cookie storage

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { User, Session } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'busala_session';
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

export function hashSessionToken(token: string): string {
  const tokenBytes = new TextEncoder().encode(token);
  const hashBytes = sha256(tokenBytes);
  return encodeHexLowerCase(hashBytes);
}

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
    },
  });

  return { session, token };
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!session) {
    return { session: null, user: null };
  }

  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: session.id } });
    return { session: null, user: null };
  }

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

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } });
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

export async function getCurrentSession(): Promise<SessionValidationResult> {
  const token = await getSessionToken();
  if (!token) {
    return { session: null, user: null };
  }
  return validateSessionToken(token);
}

export async function requireAuth(): Promise<{ session: Session; user: User }> {
  const result = await getCurrentSession();
  if (!result.session || !result.user) {
    throw new Error('Unauthorized');
  }
  return result as { session: Session; user: User };
}
