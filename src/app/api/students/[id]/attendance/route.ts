// ============================================
// STUDENT ATTENDANCE API
// GET /api/students/[id]/attendance - Attendance history for a student
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

type Params = Promise<{ id: string }>;

/**
 * GET /api/students/[id]/attendance
 * Query params: from=YYYY-MM-DD, to=YYYY-MM-DD
 * Returns attendance history with lesson details.
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id: studentId } = await params;
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    const student = await prisma.student.findFirst({
      where: { id: studentId, orgId: user.orgId },
    });

    if (!student) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    const from = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = toParam ? new Date(toParam) : new Date();

    const attendances = await prisma.attendance.findMany({
      where: {
        studentId,
        orgId: user.orgId,
        lesson: {
          startAt: { gte: from, lte: to },
        },
      },
      include: {
        lesson: {
          include: { group: true },
        },
      },
      orderBy: { lesson: { startAt: 'desc' } },
    });

    const records = attendances.map((a) => ({
      id: a.id,
      lessonId: a.lessonId,
      lessonTitle: a.lesson.title,
      lessonDate: a.lesson.startAt.toISOString(),
      groupName: a.lesson.group?.name ?? null,
      status: a.status,
      note: a.note ?? undefined,
      markedAt: a.markedAt.toISOString(),
    }));

    // Attendance percent (all-time for this student from DB)
    const percentage = student.attendancePercent ?? 0;

    return jsonResponse({
      studentId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      records,
      attendancePercent: percentage,
    });
  } catch (error) {
    console.error('GET /api/students/[id]/attendance error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch student attendance', 500);
  }
}
