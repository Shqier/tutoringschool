// ============================================
// REMOVE STUDENT FROM GROUP
// DELETE /api/groups/[id]/students/[studentId]
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string; studentId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id: groupId, studentId } = await params;

    const group = await prisma.group.findFirst({
      where: { id: groupId, orgId: user.orgId },
    });

    if (!group) {
      return errorResponse('NOT_FOUND', 'Group not found', 404);
    }

    if (!group.studentIds.includes(studentId)) {
      return errorResponse('NOT_FOUND', 'Student is not in this group', 404);
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, orgId: user.orgId },
    });

    if (!student) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    const newStudentIds = group.studentIds.filter((id) => id !== studentId);
    await prisma.group.update({
      where: { id: groupId },
      data: { studentIds: newStudentIds },
    });

    await prisma.student.update({
      where: { id: studentId },
      data: { groupIds: student.groupIds.filter((gid) => gid !== groupId) },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/groups/[id]/students/[studentId] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to remove student from group', 500);
  }
}
