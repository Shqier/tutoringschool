// ============================================
// BUSALA API: APPROVAL BY ID
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { approvalActionSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
} from '@/lib/api-utils';

// Ensure database is seeded
seedDatabase();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/approvals/[id]
 * Get a single approval by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const approval = await prisma.approval.findUnique({ where: { id } });

    if (!approval) {
      return errorResponse('NOT_FOUND', 'Approval not found', 404);
    }

    return jsonResponse(approval);
  } catch (error) {
    console.error('GET /api/approvals/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch approval', 500);
  }
}

/**
 * PATCH /api/approvals/[id]
 * Update an approval (approve or reject)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.approval.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Approval not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update approval from another organization', 403);
    }

    if (existing.status !== 'pending') {
      return errorResponse('ALREADY_PROCESSED', 'This approval has already been processed', 400);
    }

    const body = await request.json();
    const parsed = approvalActionSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { action, reviewerId, reviewerNote } = parsed.data;

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewerId: reviewerId || user.id,
        reviewerNote,
      },
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('PATCH /api/approvals/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update approval', 500);
  }
}

/**
 * POST /api/approvals/[id]/approve
 * Quick approve endpoint
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.approval.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Approval not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update approval from another organization', 403);
    }

    if (existing.status !== 'pending') {
      return errorResponse('ALREADY_PROCESSED', 'This approval has already been processed', 400);
    }

    // Try to parse body for note
    let reviewerNote: string | undefined;
    try {
      const body = await request.json();
      reviewerNote = body?.reviewerNote;
    } catch {
      // No body or invalid JSON is fine
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: 'approved',
        reviewerId: user.id,
        reviewerNote,
      },
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('POST /api/approvals/[id]/approve error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to approve', 500);
  }
}

/**
 * DELETE /api/approvals/[id]
 * Reject an approval (convenience endpoint)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.approval.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Approval not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update approval from another organization', 403);
    }

    if (existing.status !== 'pending') {
      return errorResponse('ALREADY_PROCESSED', 'This approval has already been processed', 400);
    }

    // Try to parse body for note
    let reviewerNote: string | undefined;
    try {
      const body = await request.json();
      reviewerNote = body?.reviewerNote;
    } catch {
      // No body or invalid JSON is fine
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewerId: user.id,
        reviewerNote,
      },
    });

    return jsonResponse({ success: true, approval: updated });
  } catch (error) {
    console.error('DELETE /api/approvals/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to reject approval', 500);
  }
}
