// ============================================
// USER PREFERENCES API
// GET /api/user/preferences - Current user's preferences
// PATCH /api/user/preferences - Update language, timezone, notifications
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

/**
 * GET /api/user/preferences
 * Returns the current user's preferences (language, timezone).
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    return jsonResponse({
      language: prefs?.language ?? 'en',
      timezone: prefs?.timezone ?? 'Asia/Jerusalem',
      notifications: (prefs?.notifications as Record<string, boolean>) ?? undefined,
    });
  } catch (error) {
    console.error('GET /api/user/preferences error:', error);
    return jsonResponse({ language: 'en', timezone: 'Asia/Jerusalem' }, 200);
  }
}

/**
 * PATCH /api/user/preferences
 * Update language, timezone, and optional notifications (email, sms, lessonReminders, approvalRequests).
 */
export async function PATCH(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const updates: { language?: string; timezone?: string; notifications?: Prisma.InputJsonValue } = {};
    if (typeof body.language === 'string') updates.language = body.language;
    if (typeof body.timezone === 'string') updates.timezone = body.timezone;
    if (body.notifications !== undefined && typeof body.notifications === 'object') updates.notifications = body.notifications as Prisma.InputJsonValue;

    const existing = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      const created = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          language: updates.language ?? 'en',
          timezone: updates.timezone ?? 'Asia/Jerusalem',
          notifications: updates.notifications ?? undefined,
        },
      });
      return jsonResponse({
        language: created.language,
        timezone: created.timezone,
        notifications: created.notifications as Record<string, boolean> | undefined,
      });
    }

    const updated = await prisma.userPreferences.update({
      where: { userId: user.id },
      data: updates,
    });

    return jsonResponse({
      language: updated.language,
      timezone: updated.timezone,
      notifications: updated.notifications as Record<string, boolean> | undefined,
    });
  } catch (error) {
    console.error('PATCH /api/user/preferences error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update preferences', 500);
  }
}
