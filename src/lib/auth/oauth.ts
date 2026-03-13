// OAuth Configuration for Google and Apple
// Uses Arctic library for OAuth 2.0 flows

import { generateCodeVerifier, generateState, Google, Apple } from 'arctic';
import { cookies } from 'next/headers';

// OAuth Cookie names
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_CODE_VERIFIER_COOKIE = 'oauth_code_verifier';

// Initialize OAuth providers
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/callback/google';

const appleClientId = process.env.APPLE_CLIENT_ID ?? '';
const appleTeamId = process.env.APPLE_TEAM_ID ?? '';
const appleKeyId = process.env.APPLE_KEY_ID ?? '';
const applePrivateKey = process.env.APPLE_PRIVATE_KEY ?? '';
const appleRedirectUri = process.env.APPLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/callback/apple';

// Export OAuth providers (will throw if not configured)
export const google = googleClientId && googleClientSecret
  ? new Google(googleClientId, googleClientSecret, googleRedirectUri)
  : null;

export const apple = appleClientId && appleTeamId && appleKeyId && applePrivateKey
  ? new Apple(
      appleClientId,
      appleTeamId,
      appleKeyId,
      new TextEncoder().encode(applePrivateKey),
      appleRedirectUri
    )
  : null;

/**
 * Generate OAuth authorization URL and store state in cookie
 */
export async function createGoogleAuthorizationUrl(): Promise<{ url: URL; state: string }> {
  if (!google) {
    throw new Error('Google OAuth is not configured');
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

  const cookieStore = await cookies();
  
  // Store state and code verifier in cookies
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
  
  cookieStore.set(OAUTH_CODE_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return { url, state };
}

/**
 * Create Apple authorization URL
 */
export async function createAppleAuthorizationUrl(): Promise<{ url: URL; state: string }> {
  if (!apple) {
    throw new Error('Apple OAuth is not configured');
  }

  const state = generateState();
  const url = apple.createAuthorizationURL(state, ['name', 'email']);

  const cookieStore = await cookies();
  
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return { url, state };
}

/**
 * Validate OAuth state from cookie
 */
export async function validateOAuthState(state: string): Promise<boolean> {
  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE);
  return savedState?.value === state;
}

/**
 * Get code verifier from cookie
 */
export async function getCodeVerifier(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(OAUTH_CODE_VERIFIER_COOKIE)?.value ?? null;
}

/**
 * Clear OAuth cookies
 */
export async function clearOAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_CODE_VERIFIER_COOKIE);
}

/**
 * Check if OAuth providers are configured
 */
export function isOAuthConfigured(provider: 'google' | 'apple'): boolean {
  if (provider === 'google') {
    return !!google;
  }
  if (provider === 'apple') {
    return !!apple;
  }
  return false;
}

// Types for OAuth user info
export interface GoogleUserInfo {
  sub: string;      // Google's user ID
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface AppleUserInfo {
  sub: string;      // Apple's user ID
  email: string;
  email_verified?: boolean | 'true' | 'false';
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Parse Google ID token to get user info
 */
export function parseGoogleIdToken(idToken: string): GoogleUserInfo {
  const payload = idToken.split('.')[1];
  const decoded = Buffer.from(payload, 'base64').toString('utf-8');
  return JSON.parse(decoded);
}

/**
 * Parse Apple ID token to get user info
 */
export function parseAppleIdToken(idToken: string): AppleUserInfo {
  const payload = idToken.split('.')[1];
  const decoded = Buffer.from(payload, 'base64').toString('utf-8');
  return JSON.parse(decoded);
}
