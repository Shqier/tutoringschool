// ============================================
// CHANGE PASSWORD (STUB)
// POST /api/auth/change-password - Not implemented in dev (header-based auth)
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/api-utils';

/**
 * POST /api/auth/change-password
 * Stub: Auth is header-based in dev. Returns 501.
 */
export async function POST(request: NextRequest) {
  const { authorized, errorResponse: authError } = requireRole(request, 'staff');
  if (!authorized) return authError;

  return new Response(
    JSON.stringify({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Password change is not available in dev mode. Use real authentication to enable this feature.',
      },
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
