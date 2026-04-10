// ============================================
// BUSALA API: PIPELINE GET / UPDATE / DELETE
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

const updatePipelineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const pipeline = await prisma.pipeline.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { deals: true } },
      },
    });

    if (!pipeline) return errorResponse('NOT_FOUND', 'Pipeline not found', 404);

    return jsonResponse(pipeline);
  } catch (error) {
    console.error('GET /api/pipelines/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch pipeline', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.pipeline.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Pipeline not found', 404);

    const body = await request.json();
    const parsed = updatePipelineSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { isDefault, ...rest } = parsed.data;

    if (isDefault) {
      await prisma.pipeline.updateMany({
        where: { orgId: user.orgId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.pipeline.update({
      where: { id },
      data: { ...rest, ...(isDefault !== undefined ? { isDefault } : {}) },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    return jsonResponse(pipeline);
  } catch (error) {
    console.error('PATCH /api/pipelines/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update pipeline', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.pipeline.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Pipeline not found', 404);

    await prisma.pipeline.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/pipelines/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete pipeline', 500);
  }
}
