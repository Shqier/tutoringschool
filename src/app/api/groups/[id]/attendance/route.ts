// ============================================
// GROUP ATTENDANCE API
// GET /api/groups/[id]/attendance - Attendance report for a group
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

type Params = Promise<{ id: string }>;

/**
 * GET /api/groups/[id]/attendance
 * Query params: from=, to=, studentId= (optional), groupBy=student|lesson (default: lesson)
 * Returns attendance report for the group.
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id: groupId } = await params;
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const studentIdFilter = url.searchParams.get('studentId') ?? undefined;
    const groupBy = url.searchParams.get('groupBy') === 'student' ? 'student' : 'lesson';

    const group = await prisma.group.findFirst({
      where: { id: groupId, orgId: user.orgId },
    });

    if (!group) {
      return errorResponse('NOT_FOUND', 'Group not found', 404);
    }

    const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(1));
    const to = toParam ? new Date(toParam) : new Date();

    const lessons = await prisma.lesson.findMany({
      where: {
        groupId,
        orgId: user.orgId,
        startAt: { gte: from, lte: to },
      },
      include: {
        attendances: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    const allRecords: Array<{
      studentId: string;
      studentName: string;
      lessonId: string;
      lessonTitle: string;
      lessonDate: string;
      status: string;
      note?: string;
    }> = [];

    for (const lesson of lessons) {
      for (const a of lesson.attendances) {
        if (studentIdFilter && a.studentId !== studentIdFilter) continue;
        allRecords.push({
          studentId: a.studentId,
          studentName: a.student.fullName,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonDate: lesson.startAt.toISOString(),
          status: a.status,
          note: a.note ?? undefined,
        });
      }
    }

    if (groupBy === 'student') {
      const byStudent: Record<string, typeof allRecords> = {};
      for (const r of allRecords) {
        if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
        byStudent[r.studentId].push(r);
      }
      return jsonResponse({
        groupId,
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        byStudent,
      });
    }

    const byLesson = lessons.map((l) => ({
      lessonId: l.id,
      lessonTitle: l.title,
      lessonDate: l.startAt.toISOString(),
      records: l.attendances
        .filter((a) => !studentIdFilter || a.studentId === studentIdFilter)
        .map((a) => ({
          studentId: a.studentId,
          studentName: a.student.fullName,
          lessonId: l.id,
          lessonTitle: l.title,
          lessonDate: l.startAt.toISOString(),
          status: a.status,
          note: a.note ?? undefined,
        })),
    }));

    return jsonResponse({
      groupId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      byLesson,
    });
  } catch (error) {
    console.error('GET /api/groups/[id]/attendance error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch group attendance', 500);
  }
}
