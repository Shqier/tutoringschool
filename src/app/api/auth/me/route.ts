// ============================================
// AUTH ME API
// GET /api/auth/me - Current user from headers / DB
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

/**
 * GET /api/auth/me
 * Returns the current user. Looks up by x-user-id in User table for orgId;
 * if not found, returns a synthetic user from request headers.
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user: headerUser, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const dbUser = await prisma.user.findFirst({
      where: { id: headerUser.id, orgId: headerUser.orgId },
    });

    if (dbUser) {
      return jsonResponse({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          orgId: dbUser.orgId,
          avatarUrl: dbUser.avatarUrl ?? undefined,
          phone: dbUser.phone ?? undefined,
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString(),
        },
      });
    }

    return jsonResponse({
      user: {
        id: headerUser.id,
        email: `${headerUser.id}@dev`,
        name: 'Dev User',
        role: headerUser.role,
        orgId: headerUser.orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch current user', 500);
  }
}

const updateMeSchema = {
  name: (v: unknown) => (typeof v === 'string' && v.length >= 1 ? v : undefined),
  email: (v: unknown) => (typeof v === 'string' && v.includes('@') ? v : undefined),
  phone: (v: unknown) => (v === null || v === undefined || typeof v === 'string' ? v : undefined),
  avatarUrl: (v: unknown) => (v === null || v === undefined || typeof v === 'string' ? v : undefined),
};

/**
 * PATCH /api/auth/me
 * Update current user (name, email, phone, avatarUrl). Lookup by x-user-id.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { authorized, user: headerUser, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const updates: { name?: string; email?: string; phone?: string | null; avatarUrl?: string | null } = {};
    if (body.name !== undefined) updates.name = updateMeSchema.name(body.name) ?? body.name;
    if (body.email !== undefined) updates.email = updateMeSchema.email(body.email) ?? body.email;
    if (body.phone !== undefined) updates.phone = body.phone === '' ? null : updateMeSchema.phone(body.phone);
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl === '' ? null : updateMeSchema.avatarUrl(body.avatarUrl);

    const dbUser = await prisma.user.findFirst({
      where: { id: headerUser.id, orgId: headerUser.orgId },
    });

    if (!dbUser) {
      return errorResponse('NOT_FOUND', 'User not found in database. Profile update is only available for seeded users.', 404);
    }

    if (updates.email && updates.email !== dbUser.email) {
      const existing = await prisma.user.findFirst({
        where: { email: updates.email, orgId: headerUser.orgId },
      });
      if (existing) return errorResponse('DUPLICATE_EMAIL', 'Email already in use', 409);
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: updates,
    });

    return jsonResponse({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        orgId: updated.orgId,
        avatarUrl: updated.avatarUrl ?? undefined,
        phone: updated.phone ?? undefined,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('PATCH /api/auth/me error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update profile', 500);
  }
}
