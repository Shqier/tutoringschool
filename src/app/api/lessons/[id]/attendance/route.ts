// ============================================
// LESSON ATTENDANCE API
// GET /api/lessons/[id]/attendance - Get attendance for a lesson
// POST /api/lessons/[id]/attendance - Bulk update attendance
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { bulkAttendanceSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
} from '@/lib/api-utils';

type Params = Promise<{ id: string }>;

/**
 * GET /api/lessons/[id]/attendance
 * Returns attendance records for a lesson. If no records exist, returns enrolled students with "absent" default.
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id: lessonId } = await params;

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, orgId: user.orgId },
      include: {
        group: true,
        student: true,
        teacher: true,
        room: true,
        attendances: { include: { student: { select: { id: true, fullName: true } } } },
      },
    });

    if (!lesson) {
      return errorResponse('NOT_FOUND', 'Lesson not found', 404);
    }

    // Enrolled students: group lesson → group.studentIds; one_on_one → [lesson.studentId]
    let enrolledStudentIds: string[] = [];
    if (lesson.type === 'group' && lesson.group) {
      enrolledStudentIds = lesson.group.studentIds;
    } else if (lesson.type === 'one_on_one' && lesson.studentId) {
      enrolledStudentIds = [lesson.studentId];
    }

    if (enrolledStudentIds.length === 0) {
      return jsonResponse({
        lessonId,
        lesson: {
          title: lesson.title,
          startAt: lesson.startAt.toISOString(),
          endAt: lesson.endAt.toISOString(),
          groupName: lesson.group?.name ?? null,
          teacherName: lesson.teacher?.fullName ?? null,
          roomName: lesson.room?.name ?? null,
        },
        attendances: [],
        stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0 },
      });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: enrolledStudentIds }, orgId: user.orgId },
      select: { id: true, fullName: true },
    });

    const attendanceMap = new Map(
      lesson.attendances.map((a) => [
        a.studentId,
        {
          id: a.id,
          lessonId: a.lessonId,
          studentId: a.studentId,
          status: a.status,
          markedById: a.markedById,
          markedAt: a.markedAt.toISOString(),
          note: a.note ?? undefined,
          student: { id: a.student.id, fullName: a.student.fullName },
        },
      ])
    );

    const attendances = students.map((s) => {
      const existing = attendanceMap.get(s.id);
      return existing ?? {
        id: '',
        lessonId,
        studentId: s.id,
        status: 'absent' as const,
        markedById: '',
        markedAt: '',
        note: undefined,
        student: { id: s.id, fullName: s.fullName },
      };
    });

    const stats = {
      total: attendances.length,
      present: attendances.filter((a) => a.status === 'present').length,
      absent: attendances.filter((a) => a.status === 'absent').length,
      late: attendances.filter((a) => a.status === 'late').length,
      excused: attendances.filter((a) => a.status === 'excused').length,
    };

    return jsonResponse({
      lessonId,
      lesson: {
        title: lesson.title,
        startAt: lesson.startAt.toISOString(),
        endAt: lesson.endAt.toISOString(),
        groupName: lesson.group?.name ?? null,
        teacherName: lesson.teacher?.fullName ?? null,
        roomName: lesson.room?.name ?? null,
      },
      attendances,
      stats,
    });
  } catch (error) {
    console.error('GET /api/lessons/[id]/attendance error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch attendance', 500);
  }
}

/**
 * POST /api/lessons/[id]/attendance
 * Bulk upsert attendance for a lesson. Recalculates Student.attendancePercent for affected students.
 */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id: lessonId } = await params;

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, orgId: user.orgId },
      include: { group: true },
    });

    if (!lesson) {
      return errorResponse('NOT_FOUND', 'Lesson not found', 404);
    }

    // Validation: cannot mark future lessons unless admin
    const now = new Date();
    if (lesson.startAt > now && user.role !== 'admin') {
      return errorResponse(
        'VALIDATION_ERROR',
        'Cannot mark attendance for a future lesson',
        400
      );
    }

    // Validation: cannot modify attendance older than 7 days unless manager+
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (lesson.startAt < sevenDaysAgo && user.role !== 'manager' && user.role !== 'admin') {
      return errorResponse(
        'FORBIDDEN',
        'Cannot modify attendance older than 7 days',
        403
      );
    }

    const body = await request.json();
    const parsed = bulkAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { attendances: items } = parsed.data;
    const overridePayment = request.headers.get('x-override-payment') === 'true';

    // Resolve enrolled students for this lesson
    let enrolledIds: string[] = [];
    if (lesson.type === 'group' && lesson.group) {
      enrolledIds = lesson.group.studentIds;
    } else if (lesson.studentId) {
      enrolledIds = [lesson.studentId];
    }

    for (const item of items) {
      if (!enrolledIds.includes(item.studentId)) {
        return errorResponse(
          'VALIDATION_ERROR',
          `Student ${item.studentId} is not enrolled in this lesson`,
          400
        );
      }
    }

    // Block attendance for overdue payments (unless admin override)
    if (!overridePayment) {
      const studentsMarkedPresent = items.filter(
        (a) => a.status === 'present' || a.status === 'late'
      );
      if (studentsMarkedPresent.length > 0) {
        const studentIds = studentsMarkedPresent.map((a) => a.studentId);
        const overdueStudents = await prisma.student.findMany({
          where: { id: { in: studentIds }, paymentStatus: 'overdue' },
          select: { id: true, fullName: true },
        });
        if (overdueStudents.length > 0) {
          return errorResponse(
            'PAYMENT_OVERDUE',
            `Student(s) ${overdueStudents.map((s) => s.fullName).join(', ')} have overdue payments. Add x-override-payment: true header to override.`,
            409
          );
        }
      }
    }

    const studentIdsToUpdate = [...new Set(items.map((a) => a.studentId))];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.attendance.upsert({
          where: {
            lessonId_studentId: { lessonId, studentId: item.studentId },
          },
          create: {
            lessonId,
            studentId: item.studentId,
            status: item.status,
            markedById: user.id,
            note: item.note ?? null,
            orgId: user.orgId,
          },
          update: {
            status: item.status,
            markedById: user.id,
            markedAt: new Date(),
            note: item.note ?? null,
          },
        });
      }

      // Decrement lesson credits for students marked present/late (group lessons only)
      if (lesson.type === 'group' && lesson.groupId) {
        const presentOrLateIds = items
          .filter((a) => a.status === 'present' || a.status === 'late')
          .map((a) => a.studentId);
        for (const studentId of presentOrLateIds) {
          const sub = await tx.studentSubscription.findFirst({
            where: { studentId, status: 'active', orgId: user.orgId },
            include: { plan: true },
          });
          if (sub?.plan?.type === 'subscription' && sub.plan.lessonsPerMonth) {
            let credit = await tx.lessonCredit.findUnique({
              where: {
                subscriptionId_year_month: {
                  subscriptionId: sub.id,
                  year,
                  month,
                },
              },
            });
            if (!credit) {
              const resetDate = new Date(year, month, 1);
              const lessonsIncluded = sub.plan.lessonsPerMonth ?? 0;
              credit = await tx.lessonCredit.create({
                data: {
                  studentId,
                  subscriptionId: sub.id,
                  year,
                  month,
                  lessonsIncluded,
                  lessonsUsed: 0,
                  lessonsRemaining: lessonsIncluded,
                  resetDate,
                  orgId: user.orgId,
                },
              });
            }
            if (credit.lessonsRemaining > 0) {
              await tx.lessonCredit.update({
                where: { id: credit.id },
                data: {
                  lessonsUsed: { increment: 1 },
                  lessonsRemaining: { decrement: 1 },
                },
              });
            }
          }
        }
      }

      // Recalculate attendance percent for each affected student
      for (const studentId of studentIdsToUpdate) {
        const totalLessons = await tx.attendance.count({
          where: {
            studentId,
            status: { not: 'excused' },
          },
        });
        const presentLessons = await tx.attendance.count({
          where: { studentId, status: 'present' },
        });
        const percentage = totalLessons > 0 ? (presentLessons / totalLessons) * 100 : 0;
        await tx.student.update({
          where: { id: studentId },
          data: { attendancePercent: percentage },
        });
      }
    });

    return jsonResponse({ success: true, lessonId });
  } catch (error) {
    console.error('POST /api/lessons/[id]/attendance error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to save attendance', 500);
  }
}
