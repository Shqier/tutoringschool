// ============================================
// BUSALA API: TEACHER BY ID
// ============================================

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { updateTeacherSchema } from '@/lib/validators/schemas';
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
 * Helper to count lessons today for a teacher
 */
async function countLessonsToday(teacherId: string): Promise<number> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return await prisma.lesson.count({
    where: {
      teacherId,
      status: { not: 'cancelled' },
      startAt: { gte: todayStart, lte: todayEnd },
    },
  });
}

/**
 * GET /api/teachers/[id]
 * Get a single teacher by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({ where: { id } });

    if (!teacher) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    // Enrich with lessonsToday count
    return jsonResponse({
      ...teacher,
      lessonsToday: await countLessonsToday(teacher.id),
    });
  } catch (error) {
    console.error('GET /api/teachers/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch teacher', 500);
  }
}

/**
 * PATCH /api/teachers/[id]
 * Update a teacher
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.teacher.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update teacher from another organization', 403);
    }

    const body = await request.json();
    const parsed = updateTeacherSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    // Check for duplicate email if email is being updated
    if (parsed.data.email && parsed.data.email !== existing.email) {
      const duplicate = await prisma.teacher.findFirst({
        where: {
          email: parsed.data.email,
          orgId: user.orgId,
          id: { not: id },
        },
      });

      if (duplicate) {
        return errorResponse('DUPLICATE_EMAIL', 'A teacher with this email already exists', 409);
      }
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        ...parsed.data,
        weeklyAvailability: parsed.data.weeklyAvailability as unknown as Prisma.InputJsonValue,
        availabilityExceptions: parsed.data.availabilityExceptions as unknown as Prisma.InputJsonValue,
      },
    });

    return jsonResponse({
      ...updated,
      lessonsToday: await countLessonsToday(updated.id),
    });
  } catch (error) {
    console.error('PATCH /api/teachers/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update teacher', 500);
  }
}

/**
 * DELETE /api/teachers/[id]
 * Archive (soft delete) a teacher by setting status to inactive
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.teacher.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot delete teacher from another organization', 403);
    }

    // Soft delete by setting status to inactive
    const updated = await prisma.teacher.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return jsonResponse({ success: true, teacher: updated });
  } catch (error) {
    console.error('DELETE /api/teachers/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to archive teacher', 500);
  }
}
