// ============================================
// NOTIFICATIONS - UNREAD COUNT
// GET /api/notifications/unread-count
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
      },
    });

    return jsonResponse({
      count,
    });
  } catch (error) {
    console.error('GET /api/notifications/unread-count error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch unread count', 500);
  }
}
