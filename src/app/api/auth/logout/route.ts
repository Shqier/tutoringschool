// ============================================
// AUTH LOGOUT API
// POST /api/auth/logout - Clear session and logout
// ============================================

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Clears the session cookie and returns success.
 */
export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Clear auth-related cookies
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });

  return response;
}
