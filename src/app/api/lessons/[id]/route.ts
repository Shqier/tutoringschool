// ============================================
// BUSALA API: LESSON BY ID
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { updateLessonSchema } from '@/lib/validators/schemas';
import { checkAllConflicts } from '@/lib/scheduling/conflicts';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
} from '@/lib/api-utils';

// Ensure database is seeded
seedDatabase();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/lessons/[id]
 * Get a single lesson by ID with enriched data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        teacher: true,
        room: true,
        group: true,
        student: true,
      },
    });

    if (!lesson) {
      return errorResponse('NOT_FOUND', 'Lesson not found', 404);
    }

    // Get students if it's a group lesson
    let students = null;
    if (lesson.group) {
      students = await prisma.student.findMany({
        where: { id: { in: lesson.group.studentIds } },
      });
    }

    return jsonResponse({
      id: lesson.id,
      title: lesson.title,
      startAt: lesson.startAt.toISOString(),
      endAt: lesson.endAt.toISOString(),
      type: lesson.type,
      groupId: lesson.groupId,
      studentId: lesson.studentId,
      teacherId: lesson.teacherId,
      roomId: lesson.roomId,
      status: lesson.status,
      orgId: lesson.orgId,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
      teacher: lesson.teacher || null,
      room: lesson.room || null,
      group: lesson.group ? {
        ...lesson.group,
        scheduleRule: lesson.group.scheduleRule as Record<string, unknown>,
        createdAt: lesson.group.createdAt.toISOString(),
        updatedAt: lesson.group.updatedAt.toISOString(),
      } : null,
      student: lesson.student ? {
        ...lesson.student,
        enrolledDate: lesson.student.enrolledDate.toISOString(),
        createdAt: lesson.student.createdAt.toISOString(),
        updatedAt: lesson.student.updatedAt.toISOString(),
      } : null,
      students,
    });
  } catch (error) {
    console.error('GET /api/lessons/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch lesson', 500);
  }
}

/**
 * PATCH /api/lessons/[id]
 * Update a lesson with conflict checking
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'teacher');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.lesson.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Lesson not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update lesson from another organization', 403);
    }

    const body = await request.json();
    const parsed = updateLessonSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    // Validate teacher exists (if provided)
    if (parsed.data.teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: parsed.data.teacherId } });
      if (!teacher) {
        return errorResponse('INVALID_TEACHER', 'Teacher not found', 400);
      }
    }

    // Validate room exists (if provided and not null)
    if (parsed.data.roomId !== undefined && parsed.data.roomId !== null) {
      const room = await prisma.room.findUnique({ where: { id: parsed.data.roomId } });
      if (!room) {
        return errorResponse('INVALID_ROOM', 'Room not found', 400);
      }
      if (room.status === 'maintenance') {
        return errorResponse('ROOM_UNAVAILABLE', 'Room is under maintenance', 400);
      }
    }

    // Check for conflicts if time or teacher or room is changing
    const newTeacherId = parsed.data.teacherId || existing.teacherId;
    const newRoomId = parsed.data.roomId !== undefined ? parsed.data.roomId : existing.roomId;
    const newStartAt = parsed.data.startAt || existing.startAt.toISOString();
    const newEndAt = parsed.data.endAt || existing.endAt.toISOString();

    const isTimeOrResourceChanging =
      parsed.data.teacherId ||
      parsed.data.roomId !== undefined ||
      parsed.data.startAt ||
      parsed.data.endAt;

    if (isTimeOrResourceChanging) {
      const conflictCheck = await checkAllConflicts(
        newTeacherId,
        newRoomId || undefined,
        newStartAt,
        newEndAt,
        id // Exclude current lesson
      );

      const forceUpdate = request.headers.get('x-force-update') === 'true';

      if (conflictCheck.hasConflicts && !forceUpdate) {
        return jsonResponse({
          success: false,
          conflicts: {
            teacher: conflictCheck.teacherConflicts.map(l => ({
              id: l.id,
              title: l.title,
              startAt: l.startAt,
              endAt: l.endAt,
            })),
            room: conflictCheck.roomConflicts.map(l => ({
              id: l.id,
              title: l.title,
              startAt: l.startAt,
              endAt: l.endAt,
            })),
            availability: conflictCheck.availabilityViolation ? [conflictCheck.availabilityViolation] : undefined,
          },
          message: 'Schedule conflicts detected. Set x-force-update header to true to override.',
        }, 409);
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.startAt !== undefined) updateData.startAt = new Date(parsed.data.startAt);
    if (parsed.data.endAt !== undefined) updateData.endAt = new Date(parsed.data.endAt);
    if (parsed.data.teacherId !== undefined) updateData.teacherId = parsed.data.teacherId;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    // Handle roomId: null is valid for Prisma (removes the room association)
    if (parsed.data.roomId !== undefined) {
      updateData.roomId = parsed.data.roomId;
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    // Convert dates to ISO strings for response
    const response = {
      ...updated,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('PATCH /api/lessons/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update lesson', 500);
  }
}

/**
 * DELETE /api/lessons/[id]
 * Cancel a lesson (soft delete by setting status to cancelled)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'teacher');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.lesson.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Lesson not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot cancel lesson from another organization', 403);
    }

    // Soft delete by setting status to cancelled
    const updated = await prisma.lesson.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Convert dates to ISO strings for response
    const response = {
      ...updated,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return jsonResponse({ success: true, lesson: response });
  } catch (error) {
    console.error('DELETE /api/lessons/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to cancel lesson', 500);
  }
}
