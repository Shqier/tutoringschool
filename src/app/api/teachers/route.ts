// ============================================
// BUSALA API: TEACHERS LIST & CREATE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { createTeacherSchema } from '@/lib/validators/schemas';
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
 * Helper to count lessons today for a teacher
 */
async function countLessonsToday(teacherId: string): Promise<number> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return await prisma.lesson.count({
    where: {
      teacherId,
      status: { not: 'cancelled' },
      startAt: { gte: todayStart, lte: todayEnd },
    },
  });
}

/**
 * GET /api/teachers
 * List all teachers with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);

    // Filtering
    const statusFilter = url.searchParams.get('status');
    const searchQuery = url.searchParams.get('search')?.toLowerCase();

    // Build where clause
    const where: any = { orgId: user.orgId };

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    if (searchQuery) {
      where.OR = [
        { fullName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { subjects: { hasSome: [searchQuery] } },
      ];
    }

    // Get total count
    const total = await prisma.teacher.count({ where });

    // Get paginated teachers
    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { fullName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrich with lessonsToday count
    const enrichedTeachers = await Promise.all(
      teachers.map(async (teacher) => ({
        ...teacher,
        weeklyAvailability: teacher.weeklyAvailability as any,
        lessonsToday: await countLessonsToday(teacher.id),
      }))
    );

    return jsonResponse(paginatedResponse(enrichedTeachers, page, limit, total));
  } catch (error) {
    console.error('GET /api/teachers error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch teachers', 500);
  }
}

/**
 * POST /api/teachers
 * Create a new teacher
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createTeacherSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { fullName, email, phone, subjects, status, weeklyAvailability, maxHours } = parsed.data;

    // Check for duplicate email
    const existing = await prisma.teacher.findFirst({
      where: { email, orgId: user.orgId },
    });

    if (existing) {
      return errorResponse('DUPLICATE_EMAIL', 'A teacher with this email already exists', 409);
    }

    const teacher = await prisma.teacher.create({
      data: {
        fullName,
        email,
        phone,
        subjects,
        status,
        weeklyAvailability: weeklyAvailability as any,
        hoursThisWeek: 0,
        maxHours,
        orgId: user.orgId,
      },
    });

    return jsonResponse({ ...teacher, lessonsToday: 0 }, 201);
  } catch (error) {
    console.error('POST /api/teachers error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create teacher', 500);
  }
}
