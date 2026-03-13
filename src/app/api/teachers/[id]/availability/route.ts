// ============================================
// TEACHER AVAILABILITY API
// GET /api/teachers/:id/availability
// PUT /api/teachers/:id/availability
// POST /api/teachers/:id/availability/confirm
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole, jsonResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

// Validation schema for availability slots
const timeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

const dayAvailabilitySchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  slots: z.array(timeSlotSchema).min(1, 'At least one time slot required'),
});

const availabilitySchema = z.array(dayAvailabilitySchema);

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/**
 * GET /api/teachers/:id/availability
 * Get teacher's availability
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const teacher = await prisma.teacher.findFirst({
      where: { id, orgId: user.orgId },
      select: {
        id: true,
        fullName: true,
        weeklyAvailability: true,
        availabilityStatus: true,
        availabilityConfirmedAt: true,
        availabilityConfirmedForMonth: true,
        availabilityConfirmedForYear: true,
        updatedAt: true,
      },
    });

    if (!teacher) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    // Parse availability from JSON
    const availability = (teacher.weeklyAvailability as any[]) || [];

    // Ensure all days are represented
    const fullAvailability = daysOfWeek.map((day) => {
      const dayData = availability.find((a) => a.day === day);
      return {
        day,
        slots: dayData?.slots || [],
      };
    });

    return jsonResponse({
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
      },
      availability: fullAvailability,
      status: teacher.availabilityStatus,
      confirmedAt: teacher.availabilityConfirmedAt,
      confirmedForMonth: teacher.availabilityConfirmedForMonth,
      confirmedForYear: teacher.availabilityConfirmedForYear,
      lastUpdated: teacher.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/teachers/:id/availability error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch availability', 500);
  }
}

/**
 * PUT /api/teachers/:id/availability
 * Update teacher's availability
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = availabilitySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid availability data', 400, parsed.error);
    }

    const availability = parsed.data;

    // Validate time slots (end > start, no overlaps)
    for (const day of availability) {
      for (const slot of day.slots) {
        const startMinutes = timeToMinutes(slot.start);
        const endMinutes = timeToMinutes(slot.end);

        if (endMinutes <= startMinutes) {
          return errorResponse(
            'VALIDATION_ERROR',
            `End time must be after start time for ${day.day}`,
            400
          );
        }

        // Minimum 30 minutes
        if (endMinutes - startMinutes < 30) {
          return errorResponse(
            'VALIDATION_ERROR',
            `Time slot must be at least 30 minutes for ${day.day}`,
            400
          );
        }
      }

      // Check for overlapping slots
      const sortedSlots = [...day.slots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        if (timeToMinutes(sortedSlots[i].end) > timeToMinutes(sortedSlots[i + 1].start)) {
          return errorResponse(
            'VALIDATION_ERROR',
            `Overlapping time slots for ${day.day}`,
            400
          );
        }
      }
    }

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existingTeacher) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    // Update availability
    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        weeklyAvailability: availability,
        availabilityStatus: 'updated',
        updatedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        weeklyAvailability: true,
        availabilityStatus: true,
        updatedAt: true,
      },
    });

    return jsonResponse({
      success: true,
      teacher: {
        id: updated.id,
        fullName: updated.fullName,
        availability: updated.weeklyAvailability,
        status: updated.availabilityStatus,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('PUT /api/teachers/:id/availability error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update availability', 500);
  }
}

/**
 * POST /api/teachers/:id/availability/confirm
 * Confirm availability for current/next month
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    // Get month/year from query or default to next month
    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get('month') || '0');
    const year = parseInt(url.searchParams.get('year') || '0');

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    // Check if teacher exists and user has access
    const teacher = await prisma.teacher.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!teacher) {
      return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    }

    // Teachers can only confirm their own, managers can confirm any
    if (user.role === 'teacher') {
      const dbUser = await prisma.user.findFirst({
        where: { id: user.id, orgId: user.orgId },
        select: { email: true },
      });
      if (!dbUser?.email || dbUser.email !== teacher.email) {
        return errorResponse('FORBIDDEN', 'Can only confirm own availability', 403);
      }
    }

    // Update confirmation
    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        availabilityStatus: 'confirmed',
        availabilityConfirmedAt: new Date(),
        availabilityConfirmedForMonth: targetMonth,
        availabilityConfirmedForYear: targetYear,
      },
      select: {
        id: true,
        fullName: true,
        availabilityStatus: true,
        availabilityConfirmedAt: true,
        availabilityConfirmedForMonth: true,
        availabilityConfirmedForYear: true,
      },
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: 'admin', // Will be filtered by admin query
        type: 'system',
        title: 'Availability Confirmed',
        body: `${teacher.fullName} confirmed availability for ${targetMonth}/${targetYear}`,
        data: {
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          month: targetMonth,
          year: targetYear,
        },
      },
    });

    return jsonResponse({
      success: true,
      teacher: {
        id: updated.id,
        fullName: updated.fullName,
        status: updated.availabilityStatus,
        confirmedAt: updated.availabilityConfirmedAt,
        confirmedForMonth: updated.availabilityConfirmedForMonth,
        confirmedForYear: updated.availabilityConfirmedForYear,
      },
    });
  } catch (error) {
    console.error('POST /api/teachers/:id/availability/confirm error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to confirm availability', 500);
  }
}

// Helper function
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
