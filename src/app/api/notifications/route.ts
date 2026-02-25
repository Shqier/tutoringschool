import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [recentApprovals, recentStudents, upcomingLessons] = await Promise.all([
      prisma.approval.findMany({
        where: { orgId: user.orgId, createdAt: { gte: threeDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.student.findMany({
        where: { orgId: user.orgId, createdAt: { gte: threeDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.lesson.findMany({
        where: {
          orgId: user.orgId,
          startAt: { gte: now, lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
          status: 'upcoming',
        },
        orderBy: { startAt: 'asc' },
        take: 3,
      }),
    ]);

    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      unread: boolean;
      type: 'approval' | 'student' | 'lesson';
    }> = [];

    for (const approval of recentApprovals) {
      const timeAgo = formatTimeAgo(approval.createdAt);
      notifications.push({
        id: `approval-${approval.id}`,
        title: `${approval.type === 'teacher_change' ? 'Teacher' : approval.type === 'student_request' ? 'Student' : 'Room'} request`,
        message: approval.title,
        time: timeAgo,
        unread: approval.status === 'pending',
        type: 'approval',
      });
    }

    for (const student of recentStudents) {
      const timeAgo = formatTimeAgo(student.createdAt);
      notifications.push({
        id: `student-${student.id}`,
        title: 'New student enrolled',
        message: `${student.fullName} joined the school`,
        time: timeAgo,
        unread: student.createdAt > oneDayAgo,
        type: 'student',
      });
    }

    for (const lesson of upcomingLessons) {
      const startTime = lesson.startAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      notifications.push({
        id: `lesson-${lesson.id}`,
        title: 'Upcoming lesson',
        message: `${lesson.title} starts at ${startTime}`,
        time: 'Soon',
        unread: true,
        type: 'lesson',
      });
    }

    notifications.sort((a, b) => {
      if (a.unread && !b.unread) return -1;
      if (!a.unread && b.unread) return 1;
      return 0;
    });

    return jsonResponse({
      notifications: notifications.slice(0, 8),
      unreadCount: notifications.filter(n => n.unread).length,
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch notifications', 500);
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
