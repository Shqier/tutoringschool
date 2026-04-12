// ============================================
// BUSALA API: COMPANY DETAIL — contacts by company name
// NOTE: Temporary implementation until Company model is added (VER-65).
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  jsonResponse,
  errorResponse,
  requireRole,
} from '@/lib/api-utils';

/**
 * GET /api/companies/[name]
 * Returns all contacts for a given company name.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { name } = await params;
    const companyName = decodeURIComponent(name);

    const contacts = await prisma.contact.findMany({
      where: {
        orgId: user.orgId,
        company: { equals: companyName, mode: 'insensitive' },
      },
      include: {
        _count: { select: { activities: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    if (contacts.length === 0) {
      return errorResponse('NOT_FOUND', 'Company not found', 404);
    }

    return jsonResponse({
      name: contacts[0].company || companyName,
      contactCount: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error('GET /api/companies/[name] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch company', 500);
  }
}
