// ============================================
// BUSALA API: ACTIVITIES LIST & CREATE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
  getPaginationFromUrl,
  paginatedResponse,
} from '@/lib/api-utils';

const createActivitySchema = z.object({
  type: z.enum(['note', 'call', 'email', 'meeting']),
  title: z.string().min(1).max(200),
  notes: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional().nullable(),
}).refine(
  (data) => data.contactId || data.dealId,
  { message: 'At least one of contactId or dealId must be provided' }
);

/**
 * GET /api/activities
 * List activities with optional contactId / dealId filter
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);
    const contactId = url.searchParams.get('contactId') || undefined;
    const dealId = url.searchParams.get('dealId') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const completed = url.searchParams.get('completed');

    const where: Record<string, unknown> = { orgId: user.orgId };
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;
    if (type) where.type = type;
    if (completed === 'true') where.completedAt = { not: null };
    if (completed === 'false') where.completedAt = null;

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        include: {
          contact: { select: { id: true, fullName: true, email: true } },
          deal: { select: { id: true, title: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return jsonResponse(paginatedResponse(activities, page, limit, total));
  } catch (error) {
    console.error('GET /api/activities error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch activities', 500);
  }
}

/**
 * POST /api/activities
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { contactId, dealId, dueDate, completedAt, ...rest } = parsed.data;

    // Validate contactId belongs to org
    if (contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: contactId, orgId: user.orgId } });
      if (!contact) return errorResponse('NOT_FOUND', 'Contact not found', 404);
    }

    // Validate dealId belongs to org
    if (dealId) {
      const deal = await prisma.deal.findFirst({ where: { id: dealId, orgId: user.orgId } });
      if (!deal) return errorResponse('NOT_FOUND', 'Deal not found', 404);
    }

    const activity = await prisma.activity.create({
      data: {
        ...rest,
        contactId,
        dealId,
        orgId: user.orgId,
        createdById: user.id,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
      include: {
        contact: { select: { id: true, fullName: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    return jsonResponse(activity, 201);
  } catch (error) {
    console.error('POST /api/activities error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create activity', 500);
  }
}
