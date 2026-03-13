// Google OAuth Callback Route

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import {
  google,
  validateOAuthState,
  getCodeVerifier,
  clearOAuthCookies,
  createSession,
  setSessionCookie,
  parseGoogleIdToken,
  type GoogleUserInfo,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return redirect('/login?error=oauth_cancelled');
    }

    if (!code || !state) {
      return redirect('/login?error=invalid_oauth_response');
    }

    // Validate state
    const isValidState = await validateOAuthState(state);
    if (!isValidState) {
      return redirect('/login?error=invalid_state');
    }

    // Get code verifier
    const codeVerifier = await getCodeVerifier();
    if (!codeVerifier) {
      return redirect('/login?error=missing_code_verifier');
    }

    if (!google) {
      return redirect('/login?error=oauth_not_configured');
    }

    // Exchange code for tokens
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const idToken = tokens.idToken();

    // Parse ID token to get user info
    const googleUser: GoogleUserInfo = parseGoogleIdToken(idToken);

    // Clear OAuth cookies
    await clearOAuthCookies();

    // Check if user already exists with this Google account
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.sub,
        },
      },
      include: { user: { include: { tenant: true } } },
    });

    let user;

    if (oauthAccount) {
      // Existing OAuth user - update tokens and sign in
      user = oauthAccount.user;
      
      await prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: tokens.accessToken(),
          expiresAt: tokens.accessTokenExpiresAt(),
        },
      });
    } else {
      // New OAuth user - need to check if email exists in any tenant
      // This is where we'd handle account linking or prompt for tenant selection
      const existingUsers = await prisma.user.findMany({
        where: { email: googleUser.email },
        include: { tenant: true },
      });

      if (existingUsers.length === 1) {
        // Link OAuth to existing account
        user = existingUsers[0];
        
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: googleUser.sub,
            accessToken: tokens.accessToken(),
            expiresAt: tokens.accessTokenExpiresAt(),
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
        });
      } else if (existingUsers.length > 1) {
        // Multiple tenants - redirect to tenant selection
        // Store OAuth data in temporary session or redirect with params
        return redirect(`/login?error=multiple_tenants&email=${encodeURIComponent(googleUser.email)}`);
      } else {
        // No existing user - redirect to onboarding with OAuth data
        const oauthData = encodeURIComponent(JSON.stringify({
          provider: 'google',
          providerAccountId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
        }));
        return redirect(`/onboarding?oauth=${oauthData}`);
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return redirect('/login?error=account_inactive');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const { token: sessionToken } = await createSession(user.id, {
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    await setSessionCookie(sessionToken);

    // Redirect to app
    return redirect(`/${user.tenant.subdomain}`);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return redirect('/login?error=oauth_failed');
  }
}
