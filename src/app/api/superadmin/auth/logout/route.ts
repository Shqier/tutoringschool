// ============================================
// SUPER ADMIN LOGOUT API
// ============================================

export const runtime = 'nodejs';

import { cookies } from 'next/headers';

const SUPERADMIN_COOKIE = 'superadminSession';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SUPERADMIN_COOKIE);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('[SuperAdmin Logout Error]:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
