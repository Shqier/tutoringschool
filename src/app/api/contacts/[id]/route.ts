// ============================================
// BUSALA API: CONTACT DETAIL — GET / PATCH / DELETE
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

const updateContactSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/contacts/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;

    const contact = await prisma.contact.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { activities: true } },
      },
    });

    if (!contact) return errorResponse('NOT_FOUND', 'Contact not found', 404);

    return jsonResponse(contact);
  } catch (error) {
    console.error('GET /api/contacts/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch contact', 500);
  }
}

/**
 * PATCH /api/contacts/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;

    const existing = await prisma.contact.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Contact not found', 404);

    const body = await request.json();
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    // Check for duplicate email (excluding current contact)
    if (parsed.data.email && parsed.data.email !== existing.email) {
      const duplicate = await prisma.contact.findFirst({
        where: { email: parsed.data.email, orgId: user.orgId, NOT: { id } },
      });
      if (duplicate) {
        return errorResponse('DUPLICATE_EMAIL', 'A contact with this email already exists', 409);
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: parsed.data,
      include: {
        _count: { select: { activities: true } },
      },
    });

    return jsonResponse(contact);
  } catch (error) {
    console.error('PATCH /api/contacts/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update contact', 500);
  }
}

/**
 * DELETE /api/contacts/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;

    const existing = await prisma.contact.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return errorResponse('NOT_FOUND', 'Contact not found', 404);

    await prisma.contact.delete({ where: { id } });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/contacts/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete contact', 500);
  }
}
