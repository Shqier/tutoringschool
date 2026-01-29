// ============================================
// BUSALA API: SCHEDULING
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { generateLessonsSchema, checkConflictsSchema } from '@/lib/validators/schemas';
import {
  detectAllConflicts,
  checkAllConflicts,
  previewGeneratedLessons,
  generateAndSaveLessons,
} from '@/lib/scheduling/conflicts';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
} from '@/lib/api-utils';

// Ensure database is seeded
seedDatabase();

/**
 * GET /api/scheduling
 * Get current schedule overview with conflicts
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause for date filtering
    const where: {
      orgId: string;
      startAt?: { gte?: Date; lte?: Date };
    } = { orgId: user.orgId };

    if (startDate || endDate) {
      where.startAt = {};
      if (startDate) {
        where.startAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.startAt.lte = new Date(endDate);
      }
    }

    // Get all lessons in date range
    const lessons = await prisma.lesson.findMany({
      where,
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    });

    // Detect conflicts
    const conflicts = await detectAllConflicts(user.orgId);

    // Get pending conflicts (only for non-cancelled lessons)
    const pendingConflicts = conflicts.filter(c =>
      c.lessonIds.every(lid => {
        const lesson = lessons.find(l => l.id === lid);
        return lesson && lesson.status !== 'cancelled';
      })
    );

    return jsonResponse({
      lessonsCount: lessons.length,
      conflicts: pendingConflicts,
      conflictsCount: pendingConflicts.length,
    });
  } catch (error) {
    console.error('GET /api/scheduling error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch scheduling data', 500);
  }
}

/**
 * POST /api/scheduling/check-conflicts
 * Check for conflicts for a proposed lesson time
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();

    // Determine if this is a conflict check or lesson generation
    const action = body.action || 'check-conflicts';

    if (action === 'check-conflicts') {
      const parsed = checkConflictsSchema.safeParse(body);
      if (!parsed.success) {
        return validationErrorResponse(parsed.error);
      }

      const { teacherId, roomId, startAt, endAt, excludeLessonId } = parsed.data;

      if (!teacherId && !roomId) {
        return errorResponse('INVALID_INPUT', 'Either teacherId or roomId must be provided', 400);
      }

      const conflicts = await checkAllConflicts(
        teacherId || '',
        roomId,
        startAt,
        endAt,
        excludeLessonId
      );

      return jsonResponse({
        hasConflicts: conflicts.hasConflicts,
        teacherConflicts: conflicts.teacherConflicts.map(l => ({
          id: l.id,
          title: l.title,
          startAt: typeof l.startAt === 'string' ? l.startAt : (l.startAt as Date).toISOString(),
          endAt: typeof l.endAt === 'string' ? l.endAt : (l.endAt as Date).toISOString(),
          teacherId: l.teacherId,
        })),
        roomConflicts: conflicts.roomConflicts.map(l => ({
          id: l.id,
          title: l.title,
          startAt: typeof l.startAt === 'string' ? l.startAt : (l.startAt as Date).toISOString(),
          endAt: typeof l.endAt === 'string' ? l.endAt : (l.endAt as Date).toISOString(),
          roomId: l.roomId,
        })),
      });
    }

    if (action === 'preview-generation') {
      const parsed = generateLessonsSchema.safeParse(body);
      if (!parsed.success) {
        return validationErrorResponse(parsed.error);
      }

      const { groupId, startDate, endDate } = parsed.data;

      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return errorResponse('NOT_FOUND', 'Group not found', 404);
      }

      if (!group.scheduleRule) {
        return errorResponse('NO_SCHEDULE_RULE', 'Group has no schedule rule defined', 400);
      }

      const result = await previewGeneratedLessons(
        groupId,
        startDate,
        endDate,
        group.orgId
      );

      if (!result) {
        return errorResponse('GENERATION_FAILED', 'Failed to generate lessons preview', 500);
      }

      return jsonResponse({
        preview: true,
        lessonsCount: result.lessons.length,
        lessons: result.lessons,
        conflicts: result.conflicts,
        conflictsCount: result.conflicts.length,
      });
    }

    if (action === 'generate-lessons') {
      const { authorized: isManager, user, errorResponse: managerAuthError } = requireRole(request, 'manager');
      if (!isManager) return managerAuthError;

      const parsed = generateLessonsSchema.safeParse(body);
      if (!parsed.success) {
        return validationErrorResponse(parsed.error);
      }

      const { groupId, startDate, endDate } = parsed.data;
      const skipConflicting = body.skipConflicting === true;

      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return errorResponse('NOT_FOUND', 'Group not found', 404);
      }

      if (!group.scheduleRule) {
        return errorResponse('NO_SCHEDULE_RULE', 'Group has no schedule rule defined', 400);
      }

      const result = await generateAndSaveLessons(
        groupId,
        startDate,
        endDate,
        user.orgId,
        skipConflicting
      );

      if (!result) {
        return errorResponse('GENERATION_FAILED', 'Failed to generate lessons', 500);
      }

      return jsonResponse({
        success: true,
        created: result.created.length,
        skipped: result.skipped.length,
        conflicts: result.conflicts,
        conflictsCount: result.conflicts.length,
        lessons: result.created,
      }, 201);
    }

    return errorResponse('INVALID_ACTION', 'Unknown action. Use check-conflicts, preview-generation, or generate-lessons', 400);
  } catch (error) {
    console.error('POST /api/scheduling error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to process scheduling request', 500);
  }
}
