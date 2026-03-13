// ============================================
// GROUP STATS API
// GET /api/groups/[id]/stats
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;

    const group = await prisma.group.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!group) {
      return errorResponse('NOT_FOUND', 'Group not found', 404);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lessonsThisMonth = await prisma.lesson.count({
      where: {
        groupId: id,
        orgId: user.orgId,
        status: { not: 'cancelled' },
        startAt: { gte: monthStart, lte: monthEnd },
      },
    });

    const students = await prisma.student.findMany({
      where: { id: { in: group.studentIds } },
      select: { attendancePercent: true },
    });
    const averageAttendance =
      students.length > 0
        ? students.reduce((sum, s) => sum + (s.attendancePercent ?? 0), 0) / students.length
        : 0;

    const nextLesson = await prisma.lesson.findFirst({
      where: {
        groupId: id,
        orgId: user.orgId,
        status: { in: ['upcoming', 'in_progress'] },
        startAt: { gte: now },
      },
      orderBy: { startAt: 'asc' },
      select: { id: true, title: true, startAt: true },
    });

    return jsonResponse({
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      lessonsThisMonth,
      totalStudents: group.studentIds.length,
      nextLesson: nextLesson
        ? { id: nextLesson.id, title: nextLesson.title, startAt: nextLesson.startAt.toISOString() }
        : null,
    });
  } catch (error) {
    console.error('GET /api/groups/[id]/stats error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch group stats', 500);
  }
}
