// ============================================
// BUSALA API: ACTIVITY GET / UPDATE / DELETE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
} from '@/lib/api-utils';

const updateActivitySchema = z.object({
  type: z.enum(['note', 'call', 'email', 'meeting']).optional(),
  title: z.string().min(1).max(200).optional(),
  notes: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const activity = await prisma.activity.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        contact: { select: { id: true, fullName: true, email: true, phone: true } },
        deal: { select: { id: true, title: true, stageId: true } },
      },
    });

    if (!activity) return errorResponse('NOT_FOUND', 'Activity not found', 404);

    return jsonResponse(activity);
  } catch (error) {
    console.error('GET /api/activities/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch activity', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.activity.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Activity not found', 404);

    const body = await request.json();
    const parsed = updateActivitySchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { contactId, dealId, dueDate, completedAt, ...rest } = parsed.data;

    // Validate new contactId if provided
    if (contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: contactId, orgId: user.orgId } });
      if (!contact) return errorResponse('NOT_FOUND', 'Contact not found', 404);
    }

    // Validate new dealId if provided
    if (dealId) {
      const deal = await prisma.deal.findFirst({ where: { id: dealId, orgId: user.orgId } });
      if (!deal) return errorResponse('NOT_FOUND', 'Deal not found', 404);
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...rest,
        ...(contactId !== undefined ? { contactId } : {}),
        ...(dealId !== undefined ? { dealId } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(completedAt !== undefined ? { completedAt: completedAt ? new Date(completedAt) : null } : {}),
      },
      include: {
        contact: { select: { id: true, fullName: true, email: true, phone: true } },
        deal: { select: { id: true, title: true, stageId: true } },
      },
    });

    return jsonResponse(activity);
  } catch (error) {
    console.error('PATCH /api/activities/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update activity', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.activity.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Activity not found', 404);

    await prisma.activity.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/activities/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete activity', 500);
  }
}
