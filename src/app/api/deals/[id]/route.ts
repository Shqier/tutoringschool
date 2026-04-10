// ============================================
// BUSALA API: DEAL GET / UPDATE / DELETE
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

const updateDealSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  value: z.number().optional().nullable(),
  currency: z.string().optional(),
  ownerName: z.string().optional().nullable(),
  stageId: z.string().optional(),
  notes: z.string().optional().nullable(),
  expectedClose: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const deal = await prisma.deal.findFirst({
      where: { id, orgId: user.orgId },
      include: { stage: true, pipeline: { include: { stages: { orderBy: { order: 'asc' } } } } },
    });

    if (!deal) return errorResponse('NOT_FOUND', 'Deal not found', 404);

    return jsonResponse(deal);
  } catch (error) {
    console.error('GET /api/deals/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch deal', 500);
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
    const existing = await prisma.deal.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Deal not found', 404);

    const body = await request.json();
    const parsed = updateDealSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { stageId, expectedClose, ...rest } = parsed.data;

    // Build history if stage changed
    let stageHistory = existing.stageHistory as Array<{ stageId: string; stageName: string; movedAt: string }>;
    if (stageId && stageId !== existing.stageId) {
      const stage = await prisma.pipelineStage.findFirst({
        where: { id: stageId, pipelineId: existing.pipelineId, orgId: user.orgId },
      });
      if (!stage) return errorResponse('NOT_FOUND', 'Stage not found', 404);
      stageHistory = [...stageHistory, { stageId, stageName: stage.name, movedAt: new Date().toISOString() }];
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...rest,
        ...(stageId ? { stageId } : {}),
        ...(expectedClose !== undefined ? { expectedClose: expectedClose ? new Date(expectedClose) : null } : {}),
        stageHistory: stageHistory as any,
      },
      include: { stage: true },
    });

    return jsonResponse(deal);
  } catch (error) {
    console.error('PATCH /api/deals/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update deal', 500);
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
    const existing = await prisma.deal.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Deal not found', 404);

    await prisma.deal.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/deals/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete deal', 500);
  }
}
