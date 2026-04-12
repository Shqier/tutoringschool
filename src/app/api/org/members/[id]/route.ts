// ============================================
// BUSALA API: ORG MEMBER UPDATE / DELETE
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

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'manager', 'user']),
});

/**
 * PATCH /api/org/members/[id]
 * Update a team member's role (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const { id } = await params;
    const member = await prisma.teamMember.findFirst({
      where: { id, orgId: user.orgId },
    });
    if (!member) return errorResponse('NOT_FOUND', 'Team member not found', 404);

    const body = await request.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const updated = await prisma.teamMember.update({
      where: { id },
      data: { role: parsed.data.role },
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('PATCH /api/org/members/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update team member', 500);
  }
}

/**
 * DELETE /api/org/members/[id]
 * Remove a team member (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const { id } = await params;
    const member = await prisma.teamMember.findFirst({
      where: { id, orgId: user.orgId },
    });
    if (!member) return errorResponse('NOT_FOUND', 'Team member not found', 404);

    await prisma.teamMember.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/org/members/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to remove team member', 500);
  }
}
