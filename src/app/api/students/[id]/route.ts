// ============================================
// BUSALA API: STUDENT BY ID
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { updateStudentSchema } from '@/lib/validators/schemas';
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
 * GET /api/students/[id]
 * Get a single student by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });

    if (!student) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    return jsonResponse(student);
  } catch (error) {
    console.error('GET /api/students/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch student', 500);
  }
}

/**
 * PATCH /api/students/[id]
 * Update a student
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.student.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update student from another organization', 403);
    }

    const body = await request.json();
    const parsed = updateStudentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    // Check for duplicate email if email is being updated
    if (parsed.data.email && parsed.data.email !== existing.email) {
      const duplicate = await prisma.student.findFirst({
        where: {
          email: parsed.data.email,
          orgId: user.orgId,
          id: { not: id },
        },
      });

      if (duplicate) {
        return errorResponse('DUPLICATE_EMAIL', 'A student with this email already exists', 409);
      }
    }

    const updated = await prisma.student.update({
      where: { id },
      data: parsed.data,
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('PATCH /api/students/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update student', 500);
  }
}

/**
 * DELETE /api/students/[id]
 * Archive (soft delete) a student by setting status to inactive
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.student.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot delete student from another organization', 403);
    }

    // Soft delete by setting status to inactive
    const updated = await prisma.student.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return jsonResponse({ success: true, student: updated });
  } catch (error) {
    console.error('DELETE /api/students/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to archive student', 500);
  }
}
