// ============================================
// SERVER-SIDE AUTH UTILITIES (Node.js runtime)
// Token signing/verification + password hashing
// ============================================

import { createHmac, timingSafeEqual, scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const AUTH_SECRET = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production';

export interface SessionPayload {
  id: string;
  orgId: string;
  role: string;
  exp: number;
}

/** base64url encode a string or Buffer */
function toBase64Url(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64url');
}

/** base64url decode to Buffer */
function fromBase64Url(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

/**
 * Sign a session payload into a compact HMAC-SHA256 token.
 * Format: base64url(payload) + "." + base64url(hmac)
 */
export function signSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const data = toBase64Url(JSON.stringify({ ...payload, exp }));
  const hmac = createHmac('sha256', AUTH_SECRET).update(data).digest();
  return `${data}.${toBase64Url(hmac)}`;
}

/**
 * Verify a session token. Returns payload if valid, null otherwise.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;

    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const expectedHmac = createHmac('sha256', AUTH_SECRET).update(data).digest();
    const expectedBuf = fromBase64Url(toBase64Url(expectedHmac));
    const actualBuf = fromBase64Url(sig);

    if (expectedBuf.length !== actualBuf.length) return null;
    if (!timingSafeEqual(expectedBuf, actualBuf)) return null;

    const payload: SessionPayload = JSON.parse(fromBase64Url(data).toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Hash a password using scrypt (same format as seed.ts).
 * Format: "salt:derivedKeyHex"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split(':');
  if (!salt || !storedHash) return false;
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuffer = Buffer.from(storedHash, 'hex');
  if (derivedKey.length !== hashBuffer.length) return false;
  return timingSafeEqual(derivedKey, hashBuffer);
}

/**
 * Parse the session-token cookie from a raw Cookie header string.
 * Returns the session payload or null.
 */
export function getUserFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('session-token='));
  if (!entry) return null;
  const token = entry.slice('session-token='.length);
  return verifySessionToken(token);
}
