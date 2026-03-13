// ============================================
// BUSALA API: PAYMENTS
// ============================================

import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { createPaymentSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  getPaginationFromUrl,
  requireRole,
} from '@/lib/api-utils';

/**
 * GET /api/payments
 * List payments with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);
    const studentId = url.searchParams.get('studentId');
    const statusFilter = url.searchParams.get('status');

    const where: Prisma.PaymentWhereInput = { orgId: user.orgId };
    if (studentId) where.studentId = studentId;
    if (statusFilter && statusFilter !== 'all' && ['pending', 'completed', 'failed', 'refunded'].includes(statusFilter)) {
      where.status = statusFilter as 'pending' | 'completed' | 'failed' | 'refunded';
    }

    const total = await prisma.payment.count({ where });
    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        subscription: { include: { plan: true } },
      },
      orderBy: { dueDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return jsonResponse(paginatedResponse(payments, page, limit, total));
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch payments', 500);
  }
}

/**
 * POST /api/payments
 * Create a new payment record
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { studentId, subscriptionId, amount, currency, type, status, paymentMethod, reference, lessonIds, dueDate, paidDate, notes } = parsed.data;

    const student = await prisma.student.findFirst({
      where: { id: studentId, orgId: user.orgId },
    });
    if (!student) {
      return errorResponse('NOT_FOUND', 'Student not found', 404);
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        subscriptionId: subscriptionId ?? undefined,
        amount,
        currency: currency ?? 'ILS',
        type,
        status: status ?? 'pending',
        paymentMethod: paymentMethod ?? undefined,
        reference: reference ?? undefined,
        lessonIds: lessonIds ?? [],
        dueDate: new Date(dueDate),
        paidDate: paidDate ? new Date(paidDate) : undefined,
        notes: notes ?? undefined,
        orgId: user.orgId,
      },
      include: {
        student: { select: { id: true, fullName: true } },
        subscription: { include: { plan: true } },
      },
    });

    return jsonResponse(payment, 201);
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create payment', 500);
  }
}
