// ============================================
// BUSALA API: GROUP BY ID
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { updateGroupSchema, assignStudentsSchema } from '@/lib/validators/schemas';
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
 * GET /api/groups/[id]
 * Get a single group by ID with enriched data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        teacher: true,
        room: true,
      },
    });

    if (!group) {
      return errorResponse('NOT_FOUND', 'Group not found', 404);
    }

    // Get students
    const students = await prisma.student.findMany({
      where: { id: { in: group.studentIds } },
    });

    return jsonResponse({
      ...group,
      scheduleRule: group.scheduleRule as Record<string, unknown>,
      teacher: group.teacher,
      room: group.room,
      students,
      studentsCount: group.studentIds.length,
    });
  } catch (error) {
    console.error('GET /api/groups/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch group', 500);
  }
}

/**
 * PATCH /api/groups/[id]
 * Update a group
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.group.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Group not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update group from another organization', 403);
    }

    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    // Validate teacher exists (if provided)
    if (parsed.data.teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: parsed.data.teacherId },
      });
      if (!teacher) {
        return errorResponse('INVALID_TEACHER', 'Teacher not found', 400);
      }
    }

    // Validate room exists (if provided)
    if (parsed.data.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: parsed.data.roomId },
      });
      if (!room) {
        return errorResponse('INVALID_ROOM', 'Room not found', 400);
      }
    }

    // Check for duplicate name if name is being updated
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const duplicate = await prisma.group.findFirst({
        where: {
          name: parsed.data.name,
          orgId: user.orgId,
          id: { not: id },
        },
      });

      if (duplicate) {
        return errorResponse('DUPLICATE_NAME', 'A group with this name already exists', 409);
      }
    }

    // Handle student assignment changes
    if (parsed.data.studentIds) {
      const oldStudentIds = new Set(existing.studentIds);
      const newStudentIds = new Set(parsed.data.studentIds);

      // Remove group from students no longer in the group
      for (const studentId of oldStudentIds) {
        if (!newStudentIds.has(studentId)) {
          const student = await prisma.student.findUnique({ where: { id: studentId } });
          if (student) {
            await prisma.student.update({
              where: { id: studentId },
              data: { groupIds: student.groupIds.filter(gid => gid !== id) },
            });
          }
        }
      }

      // Add group to new students
      for (const studentId of newStudentIds) {
        if (!oldStudentIds.has(studentId)) {
          const student = await prisma.student.findUnique({ where: { id: studentId } });
          if (student && !student.groupIds.includes(id)) {
            await prisma.student.update({
              where: { id: studentId },
              data: { groupIds: [...student.groupIds, id] },
            });
          }
        }
      }
    }

    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...parsed.data,
        scheduleRule: parsed.data.scheduleRule as Record<string, unknown> | undefined,
      },
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('PATCH /api/groups/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update group', 500);
  }
}

/**
 * DELETE /api/groups/[id]
 * Delete a group (and remove references from students)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.group.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Group not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot delete group from another organization', 403);
    }

    // Remove group from all students
    const students = await prisma.student.findMany({
      where: { id: { in: existing.studentIds } },
    });

    await Promise.all(
      students.map((student) =>
        prisma.student.update({
          where: { id: student.id },
          data: { groupIds: student.groupIds.filter(gid => gid !== id) },
        })
      )
    );

    await prisma.group.delete({ where: { id } });
    return jsonResponse({ success: true, deletedId: id });
  } catch (error) {
    console.error('DELETE /api/groups/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete group', 500);
  }
}

/**
 * PUT /api/groups/[id]/students
 * Assign students to a group
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.group.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Group not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot modify group from another organization', 403);
    }

    const body = await request.json();
    const parsed = assignStudentsSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { studentIds } = parsed.data;

    // Validate all students exist
    if (studentIds.length > 0) {
      const studentsCount = await prisma.student.count({
        where: { id: { in: studentIds } },
      });
      if (studentsCount !== studentIds.length) {
        return errorResponse('INVALID_STUDENT', 'One or more students not found', 400);
      }
    }

    // Update group with new students
    const oldStudentIds = new Set(existing.studentIds);
    const newStudentIds = new Set(studentIds);

    // Remove group from students no longer in the group
    for (const studentId of oldStudentIds) {
      if (!newStudentIds.has(studentId)) {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (student) {
          await prisma.student.update({
            where: { id: studentId },
            data: { groupIds: student.groupIds.filter(gid => gid !== id) },
          });
        }
      }
    }

    // Add group to new students
    for (const studentId of newStudentIds) {
      if (!oldStudentIds.has(studentId)) {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (student && !student.groupIds.includes(id)) {
          await prisma.student.update({
            where: { id: studentId },
            data: { groupIds: [...student.groupIds, id] },
          });
        }
      }
    }

    const updated = await prisma.group.update({
      where: { id },
      data: { studentIds },
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('PUT /api/groups/[id]/students error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to assign students', 500);
  }
}
