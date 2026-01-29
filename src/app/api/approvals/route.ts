// ============================================
// BUSALA API: APPROVALS LIST & CREATE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { createApprovalSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  getPaginationFromUrl,
  requireRole,
} from '@/lib/api-utils';

// Ensure database is seeded
seedDatabase();

/**
 * GET /api/approvals
 * List all approvals with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);

    // Filtering
    const typeFilter = url.searchParams.get('type');
    const statusFilter = url.searchParams.get('status');
    const priorityFilter = url.searchParams.get('priority');

    // Build where clause
    const where: any = { orgId: user.orgId };

    if (typeFilter && typeFilter !== 'all') {
      where.type = typeFilter;
    }
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }
    if (priorityFilter && priorityFilter !== 'all') {
      where.priority = priorityFilter;
    }

    // Get total count
    const total = await prisma.approval.count({ where });

    // Get paginated approvals with custom sorting
    const approvals = await prisma.approval.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // pending first (alphabetically)
        { priority: 'desc' }, // high -> medium -> low
        { createdAt: 'desc' }, // newest first
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get counts for frontend (all approvals in org)
    const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.approval.count({ where: { orgId: user.orgId } }),
      prisma.approval.count({ where: { orgId: user.orgId, status: 'pending' } }),
      prisma.approval.count({ where: { orgId: user.orgId, status: 'approved' } }),
      prisma.approval.count({ where: { orgId: user.orgId, status: 'rejected' } }),
    ]);

    const [teacherChangeCount, studentRequestCount, roomChangeCount] = await Promise.all([
      prisma.approval.count({ where: { orgId: user.orgId, type: 'teacher_change' } }),
      prisma.approval.count({ where: { orgId: user.orgId, type: 'student_request' } }),
      prisma.approval.count({ where: { orgId: user.orgId, type: 'room_change' } }),
    ]);

    const counts = {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      byType: {
        teacher_change: teacherChangeCount,
        student_request: studentRequestCount,
        room_change: roomChangeCount,
      },
    };

    return jsonResponse({
      ...paginatedResponse(approvals, page, limit, total),
      counts,
    });
  } catch (error) {
    console.error('GET /api/approvals error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch approvals', 500);
  }
}

/**
 * POST /api/approvals
 * Create a new approval request
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { type, title, description, payload, priority, requesterId, requesterName } = parsed.data;

    const approval = await prisma.approval.create({
      data: {
        type,
        title,
        description,
        payload: payload as any,
        status: 'pending',
        priority,
        requesterId,
        requesterName,
        orgId: user.orgId,
      },
    });

    return jsonResponse(approval, 201);
  } catch (error) {
    console.error('POST /api/approvals error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create approval', 500);
  }
}
