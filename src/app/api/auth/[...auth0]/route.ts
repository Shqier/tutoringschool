// ============================================
// AUTH0 API ROUTES
// Handles authentication callbacks and session management
// ============================================

import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Custom callback handler that syncs user with database
 */
const callbackHandler = handleCallback({
  async afterCallback(req: NextRequest, session: any) {
    try {
      // Sync user with database
      const { user } = session;
      
      if (user?.email) {
        // Check if user exists in database
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          // Create new user with default role
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              role: 'staff', // Default role for new users
              orgId: 'org_busala_default', // Default org
            },
          });
          
          console.log(`[Auth] Created new user: ${user.email}`);
        } else {
          // Update user info from Auth0
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name || dbUser.name,
              // Don't update role/org - those are managed internally
            },
          });
        }

        // Add database user info to session
        session.user.org_id = dbUser.orgId;
        session.user.role = dbUser.role;
        session.user.db_id = dbUser.id;
      }

      return session;
    } catch (error) {
      console.error('[Auth] Error in callback:', error);
      // Don't throw - let user continue even if DB sync fails
      return session;
    }
  },
});

/**
 * Custom login handler with organization invitation support
 */
const loginHandler = handleLogin({
  authorizationParams: {
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  },
  returnTo: '/',
});

/**
 * Custom logout handler
 */
const logoutHandler = handleLogout({
  returnTo: '/login',
});

/**
 * Main auth handler
 * Routes:
 * - /api/auth/login
 * - /api/auth/callback
 * - /api/auth/logout
 * - /api/auth/me
 */
export const GET = handleAuth({
  callback: callbackHandler,
  login: loginHandler,
  logout: logoutHandler,
});

export const POST = handleAuth({
  callback: callbackHandler,
  login: loginHandler,
  logout: logoutHandler,
});
