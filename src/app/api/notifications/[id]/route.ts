// ============================================
// NOTIFICATION - MARK AS READ
// PATCH /api/notifications/:id
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils';

/**
 * PATCH /api/notifications/:id
 * Mark notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!notification) {
      return errorResponse('NOT_FOUND', 'Notification not found', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });

    return jsonResponse({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error('PATCH /api/notifications/:id error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to mark notification as read', 500);
  }
}
