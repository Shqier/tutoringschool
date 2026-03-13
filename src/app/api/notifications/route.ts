// ============================================
// NOTIFICATIONS API
// GET    /api/notifications              - List notifications
// GET    /api/notifications/unread-count - Get unread count
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/notifications
 * List user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const where: any = {
      userId: user.id,
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        readAt: true,
        actionUrl: true,
        createdAt: true,
      },
    });

    return jsonResponse({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch notifications', 500);
  }
}
