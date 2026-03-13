// ============================================
// NOTIFICATIONS - MARK ALL AS READ
// PATCH /api/notifications/read-all
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils';

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return jsonResponse({
      success: true,
      markedAsRead: result.count,
    });
  } catch (error) {
    console.error('PATCH /api/notifications/read-all error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to mark notifications as read', 500);
  }
}
