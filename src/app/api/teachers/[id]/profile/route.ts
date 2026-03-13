// ============================================
// TEACHER PROFILE API
// GET /api/teachers/[id]/profile - Teacher + stats (merged)
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/teachers/[id]/profile
 * Returns teacher with stats: totalLessonsTaught, totalStudentsTaught, recentLessons (5), monthlyHours (last 12 months).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;

    const teacher = await prisma.teacher.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!teacher) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Total lessons taught (completed or any non-cancelled)
    const totalLessonsTaught = await prisma.lesson.count({
      where: {
        teacherId: id,
        orgId: user.orgId,
        status: { not: 'cancelled' },
        startAt: { lt: now },
      },
    });

    // Total distinct students taught: from group lessons (students in group) + one-on-one studentId
    const lessonsWithStudents = await prisma.lesson.findMany({
      where: {
        teacherId: id,
        orgId: user.orgId,
        status: { not: 'cancelled' },
      },
      select: {
        groupId: true,
        studentId: true,
        group: { select: { studentIds: true } },
      },
    });

    const studentIds = new Set<string>();
    for (const l of lessonsWithStudents) {
      if (l.studentId) studentIds.add(l.studentId);
      if (l.group?.studentIds) (l.group.studentIds as string[]).forEach((sid: string) => studentIds.add(sid));
    }
    const totalStudentsTaught = studentIds.size;

    // Recent 5 lessons
    const recentLessonsRows = await prisma.lesson.findMany({
      where: { teacherId: id, orgId: user.orgId, status: { not: 'cancelled' } },
      orderBy: { startAt: 'desc' },
      take: 5,
      include: {
        group: { select: { name: true } },
        room: { select: { name: true } },
      },
    });

    const recentLessons = recentLessonsRows.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      startAt: l.startAt.toISOString(),
      endAt: l.endAt.toISOString(),
      status: l.status,
      teacherId: l.teacherId,
      groupId: l.groupId,
      groupName: l.group?.name ?? null,
      roomId: l.roomId,
      roomName: l.room?.name ?? null,
      studentId: l.studentId,
      orgId: l.orgId,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    // Monthly hours for last 12 months
    const monthlyHours: { month: string; hours: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const lessonsInMonth = await prisma.lesson.findMany({
        where: {
          teacherId: id,
          orgId: user.orgId,
          status: { not: 'cancelled' },
          startAt: { gte: monthStart, lte: monthEnd },
        },
        select: { startAt: true, endAt: true },
      });
      let hours = 0;
      for (const l of lessonsInMonth) {
        hours += (l.endAt.getTime() - l.startAt.getTime()) / (1000 * 60 * 60);
      }
      monthlyHours.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        hours: Math.round(hours * 100) / 100,
      });
    }
    monthlyHours.reverse();

    const weeklyAvailability = (teacher.weeklyAvailability as unknown[]) || [];
    const availabilityExceptions = (teacher.availabilityExceptions as unknown[]) || [];

    return jsonResponse({
      ...teacher,
      weeklyAvailability,
      availabilityExceptions,
      lessonsToday: 0,
      totalLessonsTaught,
      totalStudentsTaught,
      recentLessons,
      monthlyHours,
      createdAt: teacher.createdAt.toISOString(),
      updatedAt: teacher.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('GET /api/teachers/[id]/profile error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch teacher profile', 500);
  }
}
