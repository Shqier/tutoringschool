// ============================================
// SETTINGS PROFILE API
// GET /api/settings/profile - Org/school profile
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { jsonResponse, requireRole } from '@/lib/api-utils';

const DEFAULT_PROFILE = {
  name: 'Busala Arabic Language Institute',
  address: '123 Education Street',
  timezone: 'Asia/Jerusalem',
  phone: '+972 2 123 4567',
  email: 'info@busala.com',
};

/**
 * GET /api/settings/profile
 * Returns org/school profile. Uses defaults until Organization model exists.
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    return jsonResponse({
      ...DEFAULT_PROFILE,
      orgId: user.orgId,
    });
  } catch (error) {
    console.error('GET /api/settings/profile error:', error);
    return jsonResponse({ ...DEFAULT_PROFILE }, 200);
  }
}
