// ============================================
// BUSALA API: OVERDUE PAYMENTS
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

/**
 * GET /api/payments/overdue
 * List payments past due date that are still pending
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const now = new Date();

    const overdue = await prisma.payment.findMany({
      where: {
        orgId: user.orgId,
        status: 'pending',
        dueDate: { lt: now },
      },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        subscription: { include: { plan: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 100,
    });

    return jsonResponse(overdue);
  } catch (error) {
    console.error('GET /api/payments/overdue error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch overdue payments', 500);
  }
}
