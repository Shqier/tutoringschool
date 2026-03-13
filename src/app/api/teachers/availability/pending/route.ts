// ============================================
// PENDING AVAILABILITY CONFIRMATIONS
// GET /api/teachers/availability/pending
// For admin to see teachers needing confirmation
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils';

/**
 * GET /api/teachers/availability/pending
 * List teachers with pending availability confirmation
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    // Get all teachers with their availability status
    const teachers = await prisma.teacher.findMany({
      where: {
        orgId: user.orgId,
        status: 'active',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        weeklyAvailability: true,
        availabilityStatus: true,
        availabilityConfirmedAt: true,
        availabilityConfirmedForMonth: true,
        availabilityConfirmedForYear: true,
        updatedAt: true,
      },
      orderBy: {
        availabilityStatus: 'asc', // pending first
      },
    });

    // Calculate days since last confirmation
    const now = new Date();
    const enrichedTeachers = teachers.map((teacher) => {
      const confirmedAt = teacher.availabilityConfirmedAt;
      const daysSinceConfirmed = confirmedAt
        ? Math.floor((now.getTime() - new Date(confirmedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Check if confirmation is for current month
      const isCurrentMonthConfirmed =
        teacher.availabilityConfirmedForMonth === month &&
        teacher.availabilityConfirmedForYear === year;

      return {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
        hasAvailability: Array.isArray(teacher.weeklyAvailability) && (teacher.weeklyAvailability as any[]).length > 0,
        status: teacher.availabilityStatus,
        confirmedAt: teacher.availabilityConfirmedAt,
        confirmedForMonth: teacher.availabilityConfirmedForMonth,
        confirmedForYear: teacher.availabilityConfirmedForYear,
        daysSinceConfirmed,
        isCurrentMonthConfirmed,
        lastUpdated: teacher.updatedAt,
      };
    });

    // Separate into categories
    const pending = enrichedTeachers.filter((t) => t.status === 'pending' || !t.isCurrentMonthConfirmed);
    const confirmed = enrichedTeachers.filter((t) => t.status === 'confirmed' && t.isCurrentMonthConfirmed);
    const updated = enrichedTeachers.filter((t) => t.status === 'updated');

    // Calculate auto-confirm dates (3 days after month start)
    const monthStart = new Date(year, month - 1, 1);
    const autoConfirmDate = new Date(monthStart);
    autoConfirmDate.setDate(autoConfirmDate.getDate() + 3);
    const daysUntilAutoConfirm = Math.max(0, Math.ceil((autoConfirmDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return jsonResponse({
      month,
      year,
      summary: {
        total: teachers.length,
        pending: pending.length,
        confirmed: confirmed.length,
        updated: updated.length,
        autoConfirmDate: autoConfirmDate.toISOString(),
        daysUntilAutoConfirm,
      },
      teachers: {
        pending,
        confirmed,
        updated,
      },
    });
  } catch (error) {
    console.error('GET /api/teachers/availability/pending error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch pending confirmations', 500);
  }
}
