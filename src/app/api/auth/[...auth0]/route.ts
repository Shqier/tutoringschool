// ============================================
// AUTH0 API ROUTES
// Handles authentication
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Auth0 Configuration
const AUTH0_DOMAIN = process.env.AUTH0_ISSUER_BASE_URL;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL;
const AUTH0_SCOPE = process.env.AUTH0_SCOPE || 'openid profile email';

/**
 * Build the Auth0 authorize URL
 */
function buildAuthorizeUrl(returnTo: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CLIENT_ID!,
    redirect_uri: `${AUTH0_BASE_URL}/api/auth/callback`,
    scope: AUTH0_SCOPE,
    state: state,
  });
  return `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
}

/**
 * Exchange code for tokens
 */
async function exchangeCodeForTokens(code: string) {
  const tokenUrl = `https://${AUTH0_DOMAIN}/oauth/token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      code: code,
      redirect_uri: `${AUTH0_BASE_URL}/api/auth/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get user info from access token
 */
async function getUserInfo(accessToken: string) {
  const userInfoUrl = `https://${AUTH0_DOMAIN}/userinfo`;
  
  const response = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

/**
 * GET /api/auth/login
 * Redirects to Auth0 for authentication
 */
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  try {
    // Handle login
    if (pathname === '/api/auth/login') {
      console.log('[Auth] Handling login');
      
      const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';
      const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64');
      
      const authUrl = buildAuthorizeUrl(returnTo, state);
      console.log('[Auth] Redirecting to Auth0');
      
      return NextResponse.redirect(authUrl);
    }
    
    // Handle callback
    if (pathname === '/api/auth/callback') {
      console.log('[Auth] Handling callback');
      
      const code = request.nextUrl.searchParams.get('code');
      const state = request.nextUrl.searchParams.get('state');
      const error = request.nextUrl.searchParams.get('error');
      
      if (error) {
        console.error('[Auth] Auth0 error:', error);
        return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
      }
      
      if (!code) {
        console.error('[Auth] No code received');
        return NextResponse.redirect(new URL('/login?error=no_code', request.url));
      }
      
      // Exchange code for tokens
      let tokens;
      try {
        tokens = await exchangeCodeForTokens(code);
        console.log('[Auth] Tokens received');
      } catch (tokenError: any) {
        console.error('[Auth] Token exchange error:', tokenError);
        return NextResponse.redirect(new URL('/login?error=token_exchange', request.url));
      }
      
      // Get user info
      let userInfo;
      try {
        userInfo = await getUserInfo(tokens.access_token);
        console.log('[Auth] User info received:', userInfo.email);
      } catch (userError: any) {
        console.error('[Auth] User info error:', userError);
        return NextResponse.redirect(new URL('/login?error=user_info', request.url));
      }
      
      // Sync user with database
      if (userInfo.email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: userInfo.email },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split('@')[0],
                role: 'staff',
                orgId: 'org_busala_default',
              },
            });
            console.log(`[Auth] Created new user: ${userInfo.email}`);
          } else {
            await prisma.user.update({
              where: { email: userInfo.email },
              data: {
                name: userInfo.name || dbUser.name,
              },
            });
          }
        } catch (dbError: any) {
          console.error('[Auth] Database sync error:', dbError);
        }
      }
      
      // Set session cookie
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.set('appSession', JSON.stringify({
        user: userInfo,
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      
      return response;
    }
    
    // Handle logout
    if (pathname === '/api/auth/logout') {
      console.log('[Auth] Handling logout');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('appSession', '', { maxAge: 0, path: '/' });
      return response;
    }
    
    // Handle me (get current user)
    if (pathname === '/api/auth/me') {
      console.log('[Auth] Handling /me');
      const sessionCookie = request.cookies.get('appSession');
      
      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      
      try {
        const session = JSON.parse(sessionCookie.value);
        return NextResponse.json({ user: session.user });
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
  } catch (error: any) {
    console.error('[Auth] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Authentication error', details: error.message },
      { status: 500 }
    );
  }
}
