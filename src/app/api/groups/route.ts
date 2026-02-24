// ============================================
// BUSALA API: GROUPS LIST & CREATE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { createGroupSchema } from '@/lib/validators/schemas';
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
 * GET /api/groups
 * List all groups with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);

    // Filtering
    const teacherIdFilter = url.searchParams.get('teacherId');
    const searchQuery = url.searchParams.get('search')?.toLowerCase();

    // Build where clause
    const where: Record<string, unknown> = { orgId: user.orgId };

    if (teacherIdFilter) {
      where.teacherId = teacherIdFilter;
    }

    if (searchQuery) {
      where.name = { contains: searchQuery, mode: 'insensitive' };
    }

    // Get total count
    const total = await prisma.group.count({ where });

    // Get paginated groups with relations
    const groups = await prisma.group.findMany({
      where,
      include: {
        teacher: true,
        room: true,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrich with teacher and room names
    const enrichedGroups = groups.map(group => ({
      ...group,
      scheduleRule: group.scheduleRule as Record<string, unknown>,
      teacherName: group.teacher.fullName,
      roomName: group.room?.name || null,
      studentsCount: group.studentIds.length,
      teacher: undefined,
      room: undefined,
    }));

    return jsonResponse(paginatedResponse(enrichedGroups, page, limit, total));
  } catch (error) {
    console.error('GET /api/groups error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch groups', 500);
  }
}

/**
 * POST /api/groups
 * Create a new group
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { name, teacherId, roomId, studentIds, scheduleRule, color } = parsed.data;

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
    }

    // Validate students exist (if provided)
    if (studentIds.length > 0) {
      const studentsCount = await prisma.student.count({
        where: { id: { in: studentIds } },
      });
      if (studentsCount !== studentIds.length) {
        return errorResponse('INVALID_STUDENT', 'One or more students not found', 400);
      }
    }

    // Check for duplicate name
    const existing = await prisma.group.findFirst({
      where: { name, orgId: user.orgId },
    });

    if (existing) {
      return errorResponse('DUPLICATE_NAME', 'A group with this name already exists', 409);
    }

    const group = await prisma.group.create({
      data: {
        name,
        teacherId,
        roomId,
        studentIds,
        scheduleRule: scheduleRule as Record<string, unknown> | undefined,
        color,
        orgId: user.orgId,
      },
    });

    // Update students' groupIds
    if (studentIds.length > 0) {
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
      });

      await Promise.all(
        students.map((student) =>
          prisma.student.update({
            where: { id: student.id },
            data: {
              groupIds: student.groupIds.includes(group.id)
                ? student.groupIds
                : [...student.groupIds, group.id],
            },
          })
        )
      );
    }

    return jsonResponse(group, 201);
  } catch (error) {
    console.error('POST /api/groups error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create group', 500);
  }
}
