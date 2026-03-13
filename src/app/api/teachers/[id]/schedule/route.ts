// ============================================
// TEACHER SCHEDULE API
// GET /api/teachers/[id]/schedule - Lessons in date range
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/teachers/[id]/schedule
 * Query: startDate, endDate (ISO). Returns lessons for teacher in range.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);

    const teacher = await prisma.teacher.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!teacher) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: id,
        orgId: user.orgId,
        startAt: { gte: startDate, lte: endDate },
      },
      orderBy: { startAt: 'asc' },
      include: {
        group: { select: { name: true } },
        room: { select: { name: true } },
        student: { select: { fullName: true } },
      },
    });

    const data = lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      startAt: l.startAt.toISOString(),
      endAt: l.endAt.toISOString(),
      status: l.status,
      teacherId: l.teacherId,
      teacherName: teacher.fullName,
      groupId: l.groupId,
      groupName: l.group?.name ?? null,
      studentId: l.studentId,
      studentName: l.student?.fullName ?? null,
      roomId: l.roomId,
      roomName: l.room?.name ?? null,
      orgId: l.orgId,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return jsonResponse({ data });
  } catch (error) {
    console.error('GET /api/teachers/[id]/schedule error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch teacher schedule', 500);
  }
}
