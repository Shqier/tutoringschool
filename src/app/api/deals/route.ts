// ============================================
// BUSALA API: DEALS LIST & CREATE
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

const createDealSchema = z.object({
  title: z.string().min(1).max(200),
  value: z.number().optional(),
  currency: z.string().optional().default('USD'),
  ownerName: z.string().optional(),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  notes: z.string().optional(),
  expectedClose: z.string().optional(),
});

/**
 * GET /api/deals
 * List deals with optional pipeline/stage filter
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);
    const pipelineId = url.searchParams.get('pipelineId') || undefined;
    const stageId = url.searchParams.get('stageId') || undefined;
    const search = url.searchParams.get('q') || undefined;

    const where: Record<string, unknown> = { orgId: user.orgId };
    if (pipelineId) where.pipelineId = pipelineId;
    if (stageId) where.stageId = stageId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [total, deals] = await Promise.all([
      prisma.deal.count({ where }),
      prisma.deal.findMany({
        where,
        include: { stage: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return jsonResponse(paginatedResponse(deals, page, limit, total));
  } catch (error) {
    console.error('GET /api/deals error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch deals', 500);
  }
}

/**
 * POST /api/deals
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createDealSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { pipelineId, stageId, expectedClose, ...rest } = parsed.data;

    // Validate pipeline & stage belong to org
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: stageId, pipelineId, orgId: user.orgId },
    });
    if (!stage) return errorResponse('NOT_FOUND', 'Pipeline stage not found', 404);

    const deal = await prisma.deal.create({
      data: {
        ...rest,
        pipelineId,
        stageId,
        orgId: user.orgId,
        ownerId: user.id,
        expectedClose: expectedClose ? new Date(expectedClose) : undefined,
        stageHistory: [{ stageId, stageName: stage.name, movedAt: new Date().toISOString() }] as any,
      },
      include: { stage: true },
    });

    return jsonResponse(deal, 201);
  } catch (error) {
    console.error('POST /api/deals error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create deal', 500);
  }
}
