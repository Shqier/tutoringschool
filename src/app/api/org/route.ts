// ============================================
// BUSALA API: ORGANIZATION INFO
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  jsonResponse,
  errorResponse,
  requireRole,
} from '@/lib/api-utils';

/**
 * GET /api/org
 * Return current org info (looked up by orgId from headers/session)
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
    });

    if (!org) {
      return errorResponse('NOT_FOUND', 'Organization not found', 404);
    }

    return jsonResponse(org);
  } catch (error) {
    console.error('GET /api/org error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch organization', 500);
  }
}
