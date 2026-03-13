// ============================================
// BUSALA API: LESSON CREDITS CURRENT MONTH
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ studentId: string }>;
}

/**
 * GET /api/lesson-credits/[studentId]/current
 * Get current month's lesson credit usage for a student
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { studentId } = await params;

    const student = await prisma.student.findFirst({
      where: { id: studentId, orgId: user.orgId },
      include: { plan: true },
    });

    if (!student) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // If student has no subscription plan, return null for credits
    if (!student.planId || !student.plan) {
      return jsonResponse({
        studentId,
        year,
        month,
        credits: null,
        plan: null,
        message: student.plan?.type === 'pay_as_you_go' ? 'Pay-as-you-go plan - no monthly credits' : 'No active subscription plan',
      });
    }

    const plan = student.plan;
    if (plan.type === 'pay_as_you_go') {
      return jsonResponse({
        studentId,
        year,
        month,
        credits: null,
        plan: { id: plan.id, name: plan.name, type: plan.type },
        message: 'Pay-as-you-go plan - no monthly credits',
      });
    }

    // Find active subscription for this student
    const subscription = await prisma.studentSubscription.findFirst({
      where: {
        studentId,
        planId: student.planId,
        status: 'active',
        orgId: user.orgId,
      },
      include: { plan: true },
    });

    if (!subscription) {
      return jsonResponse({
        studentId,
        year,
        month,
        credits: null,
        plan: { id: plan.id, name: plan.name, type: plan.type },
        message: 'No active subscription',
      });
    }

    let credit = await prisma.lessonCredit.findUnique({
      where: {
        subscriptionId_year_month: {
          subscriptionId: subscription.id,
          year,
          month,
        },
      },
    });

    // Auto-create current month credit if missing
    if (!credit) {
      const resetDate = new Date(year, month, 1); // 1st of next month
      const lessonsIncluded = plan.lessonsPerMonth ?? 0;
      credit = await prisma.lessonCredit.create({
        data: {
          studentId,
          subscriptionId: subscription.id,
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

    return jsonResponse({
      studentId,
      year,
      month,
      credits: {
        lessonsIncluded: credit.lessonsIncluded,
        lessonsUsed: credit.lessonsUsed,
        lessonsRemaining: credit.lessonsRemaining,
        resetDate: credit.resetDate,
      },
      plan: { id: plan.id, name: plan.name, type: plan.type, lessonsPerMonth: plan.lessonsPerMonth },
    });
  } catch (error) {
    console.error('GET /api/lesson-credits/[studentId]/current error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch lesson credits', 500);
  }
}
