// ============================================
// BUSALA API: RECORD PAYMENT (mark as paid)
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { recordPaymentSchema } from '@/lib/validators/schemas';
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
 * POST /api/payments/[id]/record
 * Mark a payment as paid (cash, bank_transfer, or override)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!payment || payment.orgId !== user.orgId) {
      return errorResponse('NOT_FOUND', 'Payment not found', 404);
    }

    if (payment.status === 'completed') {
      return errorResponse('CONFLICT', 'Payment is already completed', 409);
    }

    const body = await request.json();
    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const paidDate = parsed.data.paidDate ? new Date(parsed.data.paidDate) : new Date();

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: 'completed',
        paymentMethod: parsed.data.paymentMethod,
        paidDate,
        reference: parsed.data.reference ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
      include: {
        student: { select: { id: true, fullName: true } },
        subscription: { include: { plan: true } },
      },
    });

    // Update student paymentStatus to active if it was overdue
    await prisma.student.update({
      where: { id: payment.studentId },
      data: { paymentStatus: 'active' },
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('POST /api/payments/[id]/record error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to record payment', 500);
  }
}
