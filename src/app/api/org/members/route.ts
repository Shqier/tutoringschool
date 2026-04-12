// ============================================
// BUSALA API: ORG MEMBERS LIST & INVITE
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

const inviteMemberSchema = z.object({
  inviteEmail: z.string().email(),
  role: z.enum(['admin', 'manager', 'user']),
});

/**
 * GET /api/org/members
 * List all team members for the org (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);
    const status = url.searchParams.get('status') || undefined;

    const where: Record<string, unknown> = { orgId: user.orgId };
    if (status) where.status = status;

    const [total, members] = await Promise.all([
      prisma.teamMember.count({ where }),
      prisma.teamMember.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return jsonResponse(paginatedResponse(members, page, limit, total));
  } catch (error) {
    console.error('GET /api/org/members error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch team members', 500);
  }
}

/**
 * POST /api/org/members/invite
 * Create a pending team member invite (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    // Check for duplicate pending invite for same email in org
    const existing = await prisma.teamMember.findFirst({
      where: { inviteEmail: parsed.data.inviteEmail, orgId: user.orgId },
    });
    if (existing) {
      return errorResponse(
        'DUPLICATE_INVITE',
        'An invite for this email already exists in your organization',
        409
      );
    }

    const member = await prisma.teamMember.create({
      data: {
        orgId: user.orgId,
        role: parsed.data.role,
        inviteEmail: parsed.data.inviteEmail,
        status: 'pending',
      },
    });

    return jsonResponse(member, 201);
  } catch (error) {
    console.error('POST /api/org/members/invite error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create invite', 500);
  }
}
