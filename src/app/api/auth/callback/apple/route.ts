// Apple OAuth Callback Route

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import {
  apple,
  validateOAuthState,
  clearOAuthCookies,
  createSession,
  setSessionCookie,
  parseAppleIdToken,
  type AppleUserInfo,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const state = formData.get('state') as string;
    const error = formData.get('error') as string;
    
    // Apple sends user info on first sign-in
    const userData = formData.get('user') as string;
    let parsedUserData: { name?: { firstName?: string; lastName?: string } } | null = null;
    if (userData) {
      try {
        parsedUserData = JSON.parse(userData);
      } catch {
        // Ignore parse error
      }
    }

    // Check for OAuth errors
    if (error) {
      console.error('Apple OAuth error:', error);
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

    if (!apple) {
      return redirect('/login?error=oauth_not_configured');
    }

    // Exchange code for tokens
    const tokens = await apple.validateAuthorizationCode(code);
    const idToken = tokens.idToken();

    // Parse ID token to get user info
    const appleUser: AppleUserInfo = parseAppleIdToken(idToken);

    // Clear OAuth cookies
    await clearOAuthCookies();

    // Check if user already exists with this Apple account
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'apple',
          providerAccountId: appleUser.sub,
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
      const existingUsers = await prisma.user.findMany({
        where: { email: appleUser.email },
        include: { tenant: true },
      });

      if (existingUsers.length === 1) {
        // Link OAuth to existing account
        user = existingUsers[0];
        
        const name = parsedUserData?.name?.firstName && parsedUserData?.name?.lastName
          ? `${parsedUserData.name.firstName} ${parsedUserData.name.lastName}`
          : user.name;
        
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'apple',
            providerAccountId: appleUser.sub,
            accessToken: tokens.accessToken(),
            expiresAt: tokens.accessTokenExpiresAt(),
            email: appleUser.email,
            name,
          },
        });
      } else if (existingUsers.length > 1) {
        // Multiple tenants - redirect to tenant selection
        return redirect(`/login?error=multiple_tenants&email=${encodeURIComponent(appleUser.email)}`);
      } else {
        // No existing user - redirect to onboarding with OAuth data
        const name = parsedUserData?.name?.firstName && parsedUserData?.name?.lastName
          ? `${parsedUserData.name.firstName} ${parsedUserData.name.lastName}`
          : appleUser.email.split('@')[0];
          
        const oauthData = encodeURIComponent(JSON.stringify({
          provider: 'apple',
          providerAccountId: appleUser.sub,
          email: appleUser.email,
          name,
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
    console.error('Apple OAuth callback error:', error);
    return redirect('/login?error=oauth_failed');
  }
}
