// ============================================
// BUSALA API: STUDENT SUBSCRIPTIONS
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createStudentSubscriptionSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
} from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]/subscriptions
 * List subscriptions for a student
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id: studentId } = await params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { orgId: true },
    });

    if (!student || student.orgId !== user.orgId) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    const subscriptions = await prisma.studentSubscription.findMany({
      where: { studentId, orgId: user.orgId },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    });

    return jsonResponse(subscriptions);
  } catch (error) {
    console.error('GET /api/students/[id]/subscriptions error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch subscriptions', 500);
  }
}

/**
 * POST /api/students/[id]/subscriptions
 * Create a new subscription for a student
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id: studentId } = await params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { orgId: true },
    });

    if (!student || student.orgId !== user.orgId) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    const body = await request.json();
    const parsed = createStudentSubscriptionSchema.safeParse({ ...body, studentId });

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { planId, status, startDate, billingDay } = parsed.data;

    const plan = await prisma.paymentPlan.findFirst({
      where: { id: planId, orgId: user.orgId },
    });
    if (!plan) {
      return errorResponse('NOT_FOUND', 'Payment plan not found', 404);
    }

    const start = new Date(startDate);
    const nextPaymentDate = new Date(start.getFullYear(), start.getMonth(), Math.min(billingDay ?? 1, 28));
    if (nextPaymentDate < start) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    const subscription = await prisma.studentSubscription.create({
      data: {
        studentId,
        planId,
        status: status ?? 'active',
        startDate: start,
        billingDay: billingDay ?? 1,
        nextPaymentDate,
        orgId: user.orgId,
      },
      include: { plan: true },
    });

    return jsonResponse(subscription, 201);
  } catch (error) {
    console.error('POST /api/students/[id]/subscriptions error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create subscription', 500);
  }
}
