// ============================================
// BUSALA API: PIPELINE STAGES
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

const createStageSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().optional().default('#6366f1'),
  order: z.number().int().min(0),
});

const updateStagesSchema = z.array(
  z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    color: z.string().optional().default('#6366f1'),
    order: z.number().int().min(0),
  })
);

/**
 * GET /api/pipelines/[id]/stages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const pipeline = await prisma.pipeline.findFirst({ where: { id, orgId: user.orgId } });
    if (!pipeline) return errorResponse('NOT_FOUND', 'Pipeline not found', 404);

    const stages = await prisma.pipelineStage.findMany({
      where: { pipelineId: id },
      orderBy: { order: 'asc' },
    });

    return jsonResponse({ data: stages });
  } catch (error) {
    console.error('GET /api/pipelines/[id]/stages error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch stages', 500);
  }
}

/**
 * POST /api/pipelines/[id]/stages
 * Add a stage to the pipeline
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const pipeline = await prisma.pipeline.findFirst({ where: { id, orgId: user.orgId } });
    if (!pipeline) return errorResponse('NOT_FOUND', 'Pipeline not found', 404);

    const body = await request.json();
    const parsed = createStageSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const stage = await prisma.pipelineStage.create({
      data: { ...parsed.data, pipelineId: id, orgId: user.orgId },
    });

    return jsonResponse(stage, 201);
  } catch (error) {
    console.error('POST /api/pipelines/[id]/stages error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create stage', 500);
  }
}

/**
 * PUT /api/pipelines/[id]/stages
 * Replace all stages (reorder + rename + delete + create)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const pipeline = await prisma.pipeline.findFirst({ where: { id, orgId: user.orgId } });
    if (!pipeline) return errorResponse('NOT_FOUND', 'Pipeline not found', 404);

    const body = await request.json();
    const parsed = updateStagesSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const incoming = parsed.data;
    const incomingIds = incoming.filter((s) => s.id).map((s) => s.id as string);

    // Delete stages not in the incoming list
    await prisma.pipelineStage.deleteMany({
      where: { pipelineId: id, id: { notIn: incomingIds } },
    });

    // Upsert each stage
    const stages = await Promise.all(
      incoming.map((s) => {
        if (s.id) {
          return prisma.pipelineStage.update({
            where: { id: s.id },
            data: { name: s.name, color: s.color, order: s.order },
          });
        } else {
          return prisma.pipelineStage.create({
            data: {
              name: s.name,
              color: s.color,
              order: s.order,
              pipelineId: id,
              orgId: user.orgId,
            },
          });
        }
      })
    );

    return jsonResponse({ data: stages.sort((a, b) => a.order - b.order) });
  } catch (error) {
    console.error('PUT /api/pipelines/[id]/stages error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update stages', 500);
  }
}
