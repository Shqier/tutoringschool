// ============================================
// BUSALA API: PAYMENT PLANS
// ============================================

import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { createPaymentPlanSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  getPaginationFromUrl,
  requireRole,
} from '@/lib/api-utils';

seedDatabase();

/**
 * GET /api/payment-plans
 * List all payment plans with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);
    const typeFilter = url.searchParams.get('type');
    const tierFilter = url.searchParams.get('tier');

    const where: Prisma.PaymentPlanWhereInput = { orgId: user.orgId };
    if (typeFilter && typeFilter !== 'all' && (typeFilter === 'subscription' || typeFilter === 'pay_as_you_go')) {
      where.type = typeFilter;
    }
    if (tierFilter && tierFilter !== 'all' && (tierFilter === 'elementary' || tierFilter === 'high_school')) {
      where.tier = tierFilter;
    }

    const total = await prisma.paymentPlan.count({ where });
    const plans = await prisma.paymentPlan.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { type: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    return jsonResponse(paginatedResponse(plans, page, limit, total));
  } catch (error) {
    console.error('GET /api/payment-plans error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch payment plans', 500);
  }
}

/**
 * POST /api/payment-plans
 * Create a new payment plan
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createPaymentPlanSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const plan = await prisma.paymentPlan.create({
      data: {
        ...parsed.data,
        lessonsPerMonth: parsed.data.lessonsPerMonth ?? undefined,
        monthlyPrice: parsed.data.monthlyPrice ?? undefined,
        lessonPrice: parsed.data.lessonPrice ?? undefined,
        orgId: user.orgId,
      },
    });

    return jsonResponse(plan, 201);
  } catch (error) {
    console.error('POST /api/payment-plans error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create payment plan', 500);
  }
}
