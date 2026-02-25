// ============================================
// BUSALA API: STUDENTS LIST & CREATE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { createStudentSchema } from '@/lib/validators/schemas';
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
 * GET /api/students
 * List all students with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);

    // Filtering
    const statusFilter = url.searchParams.get('status');
    const groupIdFilter = url.searchParams.get('groupId');
    const searchQuery = url.searchParams.get('search')?.toLowerCase();

    // Build where clause
    const where: Record<string, unknown> = { orgId: user.orgId };

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    if (groupIdFilter) {
      where.groupIds = { has: groupIdFilter };
    }

    if (searchQuery) {
      where.OR = [
        { fullName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Get paginated students
    const students = await prisma.student.findMany({
      where,
      orderBy: { fullName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return jsonResponse(paginatedResponse(students, page, limit, total));
  } catch (error) {
    console.error('GET /api/students error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch students', 500);
  }
}

/**
 * POST /api/students
 * Create a new student
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createStudentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { fullName, email, phone, status, groupIds, balance, plan } = parsed.data;

    // Check for duplicate email
    const existing = await prisma.student.findFirst({
      where: { email, orgId: user.orgId },
    });

    if (existing) {
      return errorResponse('DUPLICATE_EMAIL', 'A student with this email already exists', 409);
    }

    const student = await prisma.student.create({
      data: {
        fullName,
        email,
        phone,
        status,
        groupIds,
        attendancePercent: 100,
        balance,
        plan,
        orgId: user.orgId,
      },
    });

    return jsonResponse(student, 201);
  } catch (error) {
    console.error('POST /api/students error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create student', 500);
  }
}
