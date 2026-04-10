// ============================================
// BUSALA API: PIPELINES LIST & CREATE
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

const createPipelineSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  stages: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().optional().default('#6366f1'),
        order: z.number().int().min(0),
      })
    )
    .optional()
    .default([]),
});

/**
 * GET /api/pipelines
 * List all pipelines for the org with their stages
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const pipelines = await prisma.pipeline.findMany({
      where: { orgId: user.orgId },
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { deals: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return jsonResponse({ data: pipelines });
  } catch (error) {
    console.error('GET /api/pipelines error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch pipelines', 500);
  }
}

/**
 * POST /api/pipelines
 * Create a new pipeline (with optional initial stages)
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createPipelineSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { name, description, isDefault, stages } = parsed.data;

    // If this is default, unset others
    if (isDefault) {
      await prisma.pipeline.updateMany({
        where: { orgId: user.orgId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        description,
        isDefault,
        orgId: user.orgId,
        stages: {
          create: stages.map((s) => ({
            name: s.name,
            color: s.color,
            order: s.order,
            orgId: user.orgId,
          })),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    return jsonResponse(pipeline, 201);
  } catch (error) {
    console.error('POST /api/pipelines error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create pipeline', 500);
  }
}
