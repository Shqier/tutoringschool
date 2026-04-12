// ============================================
// BUSALA API: COMPANIES — derived from Contact.company field
// NOTE: This will be replaced with a proper Company model once VER-65 is complete.
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  jsonResponse,
  errorResponse,
  requireRole,
} from '@/lib/api-utils';

/**
 * GET /api/companies
 * Returns unique company names with contact count and deal count.
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const search = url.searchParams.get('q') || undefined;

    // Get all contacts that have a non-null company
    const contacts = await prisma.contact.findMany({
      where: {
        orgId: user.orgId,
        company: { not: null },
        ...(search
          ? { company: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        title: true,
        company: true,
        createdAt: true,
      },
    });

    // Group by company name
    const companyMap = new Map<
      string,
      { name: string; contactCount: number; contacts: typeof contacts }
    >();

    for (const contact of contacts) {
      if (!contact.company) continue;
      const key = contact.company.toLowerCase().trim();
      if (!companyMap.has(key)) {
        companyMap.set(key, {
          name: contact.company,
          contactCount: 0,
          contacts: [],
        });
      }
      const entry = companyMap.get(key)!;
      entry.contactCount++;
      entry.contacts.push(contact);
    }

    const companies = Array.from(companyMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        name: c.name,
        contactCount: c.contactCount,
        contacts: c.contacts.slice(0, 3), // preview of first 3 contacts
      }));

    return jsonResponse({ data: companies, total: companies.length });
  } catch (error) {
    console.error('GET /api/companies error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch companies', 500);
  }
}
