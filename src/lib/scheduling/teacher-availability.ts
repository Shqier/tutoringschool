// ============================================
// TEACHER AVAILABILITY CHECKING
// ============================================

import { prisma } from '../db/prisma';
import type { AvailabilitySlot, AvailabilityException } from '../db/types';

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  reason?: string;
}

/**
 * Parse time string (HH:mm) and apply to a date (using UTC)
 */
function applyTimeToDate(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setUTCHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Get date in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if a lesson time falls within a weekly availability slot
 */
function isWithinWeeklySlot(
  lessonStart: Date,
  lessonEnd: Date,
  slot: AvailabilitySlot
): boolean {
  const lessonDayOfWeek = lessonStart.getUTCDay();

  // Check if the day matches
  if (lessonDayOfWeek !== slot.dayOfWeek) {
    return false;
  }

  // Create dates for slot times on the same day as the lesson
  const slotStart = applyTimeToDate(lessonStart, slot.startTime);
  const slotEnd = applyTimeToDate(lessonStart, slot.endTime);

  // Lesson must be fully contained within the slot
  return lessonStart >= slotStart && lessonEnd <= slotEnd;
}

/**
 * Check if a lesson time is affected by an availability exception
 */
function isAffectedByException(
  lessonStart: Date,
  lessonEnd: Date,
  exception: AvailabilityException
): boolean {
  const lessonDateStr = getDateString(lessonStart);

  // Check if lesson date is within exception date range
  if (lessonDateStr < exception.startDate || lessonDateStr > exception.endDate) {
    return false;
  }

  // If all-day exception, it affects the entire day
  if (exception.allDay) {
    return true;
  }

  // If specific hours, check time overlap
  if (exception.startTime && exception.endTime) {
    const exceptionStart = applyTimeToDate(lessonStart, exception.startTime);
    const exceptionEnd = applyTimeToDate(lessonStart, exception.endTime);

    // Check if lesson overlaps with exception time
    return lessonStart < exceptionEnd && lessonEnd > exceptionStart;
  }

  return false;
}

/**
 * Check if a teacher is available for a lesson at the given time
 * Returns { isAvailable: true } if available
 * Returns { isAvailable: false, reason: string } if not available
 */
export async function checkTeacherAvailability(
  teacherId: string,
  startAtISO: string,
  endAtISO: string
): Promise<AvailabilityCheckResult> {
  const lessonStart = new Date(startAtISO);
  const lessonEnd = new Date(endAtISO);

  // Fetch teacher with availability data
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      weeklyAvailability: true,
      availabilityExceptions: true,
    },
  });

  if (!teacher) {
    return { isAvailable: false, reason: 'Teacher not found' };
  }

  const weeklyAvailability = teacher.weeklyAvailability as unknown as AvailabilitySlot[];
  const exceptions = (teacher.availabilityExceptions as unknown as AvailabilityException[]) || [];

  // Step 1: Check for unavailable exceptions (they block time)
  for (const exception of exceptions) {
    if (exception.type === 'unavailable' && isAffectedByException(lessonStart, lessonEnd, exception)) {
      const reason = exception.reason
        ? `Teacher unavailable: ${exception.reason}`
        : 'Teacher unavailable due to exception';
      return { isAvailable: false, reason };
    }
  }

  // Step 2: Check for available override exceptions (they allow time)
  for (const exception of exceptions) {
    if (exception.type === 'available' && isAffectedByException(lessonStart, lessonEnd, exception)) {
      // Available override found - teacher is available
      return { isAvailable: true };
    }
  }

  // Step 3: Check weekly availability schedule
  const isInWeeklySchedule = weeklyAvailability.some(slot =>
    isWithinWeeklySlot(lessonStart, lessonEnd, slot)
  );

  if (isInWeeklySchedule) {
    return { isAvailable: true };
  }

  // Not in weekly schedule and no override exception
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[lessonStart.getUTCDay()];
  return {
    isAvailable: false,
    reason: `Teacher not available on ${dayName} at this time`
  };
}
