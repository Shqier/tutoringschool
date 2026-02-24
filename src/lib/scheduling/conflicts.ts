// ============================================
// BUSALA SCHEDULING CONFLICT DETECTION
// ============================================

import { prisma } from '../db/prisma';
import type { Lesson, ScheduleConflict, Group } from '../db/types';
import { v4 as uuidv4 } from 'uuid';
import { checkTeacherAvailability } from './teacher-availability';

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Check for teacher conflicts
 * A teacher cannot have overlapping lessons
 */
export async function checkTeacherConflict(
  teacherId: string,
  startAt: string,
  endAt: string,
  excludeLessonId?: string
): Promise<Lesson[]> {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const teacherLessons = await prisma.lesson.findMany({
    where: {
      teacherId,
      status: { not: 'cancelled' },
      id: excludeLessonId ? { not: excludeLessonId } : undefined,
    },
  });

  return teacherLessons.filter(lesson => {
    return timeRangesOverlap(start, end, lesson.startAt, lesson.endAt);
  }) as unknown as Lesson[];
}

/**
 * Check for room conflicts
 * A room cannot have overlapping lessons
 */
export async function checkRoomConflict(
  roomId: string,
  startAt: string,
  endAt: string,
  excludeLessonId?: string
): Promise<Lesson[]> {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const roomLessons = await prisma.lesson.findMany({
    where: {
      roomId,
      status: { not: 'cancelled' },
      id: excludeLessonId ? { not: excludeLessonId } : undefined,
    },
  });

  return roomLessons.filter(lesson => {
    return timeRangesOverlap(start, end, lesson.startAt, lesson.endAt);
  }) as unknown as Lesson[];
}

/**
 * Check all conflicts for a proposed lesson
 */
export async function checkAllConflicts(
  teacherId: string,
  roomId: string | undefined,
  startAt: string,
  endAt: string,
  excludeLessonId?: string
): Promise<{
  teacherConflicts: Lesson[];
  roomConflicts: Lesson[];
  availabilityViolation?: string;
  hasConflicts: boolean;
}> {
  const teacherConflicts = await checkTeacherConflict(teacherId, startAt, endAt, excludeLessonId);
  const roomConflicts = roomId
    ? await checkRoomConflict(roomId, startAt, endAt, excludeLessonId)
    : [];

  // Check teacher availability
  const availabilityCheck = await checkTeacherAvailability(teacherId, startAt, endAt);
  const availabilityViolation = availabilityCheck.isAvailable ? undefined : availabilityCheck.reason;

  return {
    teacherConflicts,
    roomConflicts,
    availabilityViolation,
    hasConflicts: teacherConflicts.length > 0 || roomConflicts.length > 0 || !!availabilityViolation,
  };
}

/**
 * Detect all conflicts in the system
 */
export async function detectAllConflicts(orgId: string): Promise<ScheduleConflict[]> {
  const lessons = await prisma.lesson.findMany({
    where: {
      orgId,
      status: { not: 'cancelled' },
    },
    orderBy: { startAt: 'asc' },
  });

  const conflicts: ScheduleConflict[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < lessons.length; i++) {
    for (let j = i + 1; j < lessons.length; j++) {
      const lesson1 = lessons[i];
      const lesson2 = lessons[j];

      // Skip if lesson2 starts after lesson1 ends (lessons are sorted by start time)
      if (new Date(lesson2.startAt) >= new Date(lesson1.endAt)) {
        break;
      }

      const start1 = new Date(lesson1.startAt);
      const end1 = new Date(lesson1.endAt);
      const start2 = new Date(lesson2.startAt);
      const end2 = new Date(lesson2.endAt);

      if (timeRangesOverlap(start1, end1, start2, end2)) {
        // Check teacher conflict
        if (lesson1.teacherId === lesson2.teacherId) {
          const pairKey = `teacher:${lesson1.teacherId}:${[lesson1.id, lesson2.id].sort().join(':')}`;
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            const teacher = await prisma.teacher.findUnique({
              where: { id: lesson1.teacherId },
            });
            conflicts.push({
              id: uuidv4(),
              type: 'teacher',
              description: `${teacher?.fullName || 'Teacher'} has overlapping lessons`,
              lessonIds: [lesson1.id, lesson2.id],
              severity: 'high',
            });
          }
        }

        // Check room conflict
        if (lesson1.roomId && lesson1.roomId === lesson2.roomId) {
          const pairKey = `room:${lesson1.roomId}:${[lesson1.id, lesson2.id].sort().join(':')}`;
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            const room = await prisma.room.findUnique({
              where: { id: lesson1.roomId },
            });
            conflicts.push({
              id: uuidv4(),
              type: 'room',
              description: `${room?.name || 'Room'} is double-booked`,
              lessonIds: [lesson1.id, lesson2.id],
              severity: 'high',
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Generate lessons for a group based on its schedule rule
 */
export async function generateLessonsForGroup(
  group: Group,
  startDateStr: string,
  endDateStr: string,
  orgId: string
): Promise<{ lessons: Lesson[]; conflicts: ScheduleConflict[] }> {
  const scheduleRule = group.scheduleRule;
  if (!scheduleRule || typeof scheduleRule !== 'object') {
    return { lessons: [], conflicts: [] };
  }

  const rule = scheduleRule as Record<string, unknown>;
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const lessons: Lesson[] = [];
  const conflicts: ScheduleConflict[] = [];

  // Parse time strings
  const [startHour, startMinute] = rule.startTime.split(':').map(Number);
  const [endHour, endMinute] = rule.endTime.split(':').map(Number);

  // Iterate through each day in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Check if this day is in the schedule rule
    if (rule.daysOfWeek.includes(dayOfWeek)) {
      const lessonStart = new Date(currentDate);
      lessonStart.setHours(startHour, startMinute, 0, 0);

      const lessonEnd = new Date(currentDate);
      lessonEnd.setHours(endHour, endMinute, 0, 0);

      // Check for conflicts
      const conflictCheck = await checkAllConflicts(
        group.teacherId,
        rule.roomId || group.roomId,
        lessonStart.toISOString(),
        lessonEnd.toISOString()
      );

      const lesson: Lesson = {
        id: uuidv4(),
        title: group.name,
        startAt: lessonStart.toISOString(),
        endAt: lessonEnd.toISOString(),
        type: 'group',
        groupId: group.id,
        teacherId: group.teacherId,
        roomId: rule.roomId || group.roomId,
        status: 'upcoming',
        orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      lessons.push(lesson);

      // Track conflicts
      if (conflictCheck.teacherConflicts.length > 0) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: group.teacherId },
        });
        conflicts.push({
          id: uuidv4(),
          type: 'teacher',
          description: `${teacher?.fullName || 'Teacher'} has a conflict on ${lessonStart.toLocaleDateString()}`,
          lessonIds: [lesson.id, ...conflictCheck.teacherConflicts.map(l => l.id)],
          severity: 'high',
        });
      }

      if (conflictCheck.roomConflicts.length > 0) {
        const room = await prisma.room.findUnique({
          where: { id: rule.roomId || group.roomId || '' },
        });
        conflicts.push({
          id: uuidv4(),
          type: 'room',
          description: `${room?.name || 'Room'} has a conflict on ${lessonStart.toLocaleDateString()}`,
          lessonIds: [lesson.id, ...conflictCheck.roomConflicts.map(l => l.id)],
          severity: 'high',
        });
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { lessons, conflicts };
}

/**
 * Preview generated lessons without saving (dry run)
 */
export async function previewGeneratedLessons(
  groupId: string,
  startDateStr: string,
  endDateStr: string,
  orgId: string
): Promise<{ lessons: Lesson[]; conflicts: ScheduleConflict[] } | null> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return null;

  return generateLessonsForGroup(group as unknown as Group, startDateStr, endDateStr, orgId);
}

/**
 * Generate and save lessons for a group
 */
export async function generateAndSaveLessons(
  groupId: string,
  startDateStr: string,
  endDateStr: string,
  orgId: string,
  skipConflicting: boolean = false
): Promise<{ created: Lesson[]; skipped: Lesson[]; conflicts: ScheduleConflict[] } | null> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return null;

  const { lessons, conflicts } = await generateLessonsForGroup(group as unknown as Group, startDateStr, endDateStr, orgId);

  const created: Lesson[] = [];
  const skipped: Lesson[] = [];

  for (const lesson of lessons) {
    const hasConflict = conflicts.some(c => c.lessonIds.includes(lesson.id));

    if (hasConflict && skipConflicting) {
      skipped.push(lesson);
    } else {
      const createdLesson = await prisma.lesson.create({
        data: {
          id: lesson.id,
          title: lesson.title,
          startAt: new Date(lesson.startAt),
          endAt: new Date(lesson.endAt),
          type: lesson.type,
          groupId: lesson.groupId,
          studentId: lesson.studentId,
          teacherId: lesson.teacherId,
          roomId: lesson.roomId,
          status: lesson.status,
          orgId: lesson.orgId,
        },
      });
      created.push(createdLesson as unknown as Lesson);
    }
  }

  return { created, skipped, conflicts };
}
