// ============================================
// BUSALA API: CONTACTS LIST & CREATE
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

const createContactSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/contacts
 * List contacts with optional search, company filter, sort
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);
    const search = url.searchParams.get('q') || undefined;
    const company = url.searchParams.get('company') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = { orgId: user.orgId };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    const validSortFields = ['fullName', 'createdAt', 'updatedAt', 'email', 'company'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        include: {
          _count: { select: { activities: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return jsonResponse(paginatedResponse(contacts, page, limit, total));
  } catch (error) {
    console.error('GET /api/contacts error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch contacts', 500);
  }
}

/**
 * POST /api/contacts
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    // Check for duplicate email within org
    if (parsed.data.email) {
      const existing = await prisma.contact.findFirst({
        where: { email: parsed.data.email, orgId: user.orgId },
      });
      if (existing) {
        return errorResponse('DUPLICATE_EMAIL', 'A contact with this email already exists', 409);
      }
    }

    const contact = await prisma.contact.create({
      data: {
        ...parsed.data,
        orgId: user.orgId,
      },
      include: {
        _count: { select: { activities: true } },
      },
    });

    return jsonResponse(contact, 201);
  } catch (error) {
    console.error('POST /api/contacts error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create contact', 500);
  }
}
