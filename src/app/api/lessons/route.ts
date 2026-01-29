// ============================================
// BUSALA API: LESSONS LIST & CREATE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { createLessonSchema, lessonFilterSchema } from '@/lib/validators/schemas';
import { checkAllConflicts } from '@/lib/scheduling/conflicts';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  getPaginationFromUrl,
  requireRole,
} from '@/lib/api-utils';

// Ensure database is seeded
seedDatabase();

/**
 * GET /api/lessons
 * List all lessons with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);

    // Parse filters
    const filterParams = {
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      teacherId: url.searchParams.get('teacherId') || undefined,
      roomId: url.searchParams.get('roomId') || undefined,
      groupId: url.searchParams.get('groupId') || undefined,
      studentId: url.searchParams.get('studentId') || undefined,
      status: url.searchParams.get('status') || undefined,
    };

    const filterParsed = lessonFilterSchema.safeParse(filterParams);
    if (!filterParsed.success) {
      return validationErrorResponse(filterParsed.error);
    }

    const filters = filterParsed.data;

    // Build where clause
    const where: any = { orgId: user.orgId };

    if (filters.startDate) {
      where.startAt = { ...where.startAt, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.startAt = { ...where.startAt, lte: new Date(filters.endDate) };
    }
    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }
    if (filters.roomId) {
      where.roomId = filters.roomId;
    }
    if (filters.groupId) {
      where.groupId = filters.groupId;
    }
    if (filters.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    // Get total count
    const total = await prisma.lesson.count({ where });

    // Get paginated lessons with relations
    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        teacher: true,
        room: true,
        group: true,
        student: true,
      },
      orderBy: { startAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrich with names
    const enrichedLessons = lessons.map(lesson => ({
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
      teacherName: lesson.teacher.fullName,
      roomName: lesson.room?.name || null,
      groupName: lesson.group?.name || null,
      studentName: lesson.student?.fullName || null,
    }));

    return jsonResponse(paginatedResponse(enrichedLessons, page, limit, total));
  } catch (error) {
    console.error('GET /api/lessons error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch lessons', 500);
  }
}

/**
 * POST /api/lessons
 * Create a new lesson with conflict checking
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'teacher');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createLessonSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { title, startAt, endAt, type, groupId, studentId, teacherId, roomId, status } = parsed.data;

    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return errorResponse('INVALID_TEACHER', 'Teacher not found', 400);
    }

    // Validate room exists (if provided)
    if (roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        return errorResponse('INVALID_ROOM', 'Room not found', 400);
      }
      if (room.status === 'maintenance') {
        return errorResponse('ROOM_UNAVAILABLE', 'Room is under maintenance', 400);
      }
    }

    // Validate group exists (if provided)
    if (groupId) {
      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (!group) {
        return errorResponse('INVALID_GROUP', 'Group not found', 400);
      }
    }

    // Validate student exists (if provided)
    if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) {
        return errorResponse('INVALID_STUDENT', 'Student not found', 400);
      }
    }

    // Check for conflicts
    const conflictCheck = await checkAllConflicts(teacherId, roomId, startAt, endAt);

    // If there are conflicts, check if force flag is set
    const forceCreate = request.headers.get('x-force-create') === 'true';

    if (conflictCheck.hasConflicts && !forceCreate) {
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
        message: 'Schedule conflicts detected. Set x-force-create header to true to override.',
      }, 409);
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        type,
        groupId,
        studentId,
        teacherId,
        roomId,
        status,
        orgId: user.orgId,
      },
    });

    // Convert dates to ISO strings for response
    const response = {
      ...lesson,
      startAt: lesson.startAt.toISOString(),
      endAt: lesson.endAt.toISOString(),
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    };

    return jsonResponse(response, 201);
  } catch (error) {
    console.error('POST /api/lessons error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create lesson', 500);
  }
}
