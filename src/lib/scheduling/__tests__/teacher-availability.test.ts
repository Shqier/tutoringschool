import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkTeacherAvailability } from '../teacher-availability';
import { prisma } from '../../db/prisma';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_ORG_ID = 'org_busala_default';

async function createTestTeacher(weeklyAvailability: unknown[], exceptions: unknown[] = []) {
  const randomId = Math.random().toString(36).substring(7);
  return await prisma.teacher.create({
    data: {
      id: uuidv4(),
      fullName: `Test Teacher ${randomId}`,
      email: `teacher_${randomId}_${Date.now()}@test.com`,
      subjects: ['Math'],
      status: 'active',
      weeklyAvailability: weeklyAvailability as unknown as Record<string, unknown>[],
      availabilityExceptions: exceptions as unknown as Record<string, unknown>[],
      hoursThisWeek: 0,
      maxHours: 25,
      orgId: DEFAULT_ORG_ID,
    },
  });
}

async function cleanDatabase() {
  await prisma.teacher.deleteMany({});
}

describe('Teacher Availability Checking', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('Weekly Availability', () => {
    it('should return available when lesson is within weekly schedule', async () => {
      // Monday 9:00-17:00 available
      const teacher = await createTestTeacher([
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ]);

      // Monday 10:00-11:00 lesson (UTC)
      const nextMonday = new Date();
      nextMonday.setUTCDate(nextMonday.getUTCDate() + ((1 + 7 - nextMonday.getUTCDay()) % 7));
      nextMonday.setUTCHours(10, 0, 0, 0);
      const endTime = new Date(nextMonday);
      endTime.setUTCHours(11, 0, 0, 0);

      const result = await checkTeacherAvailability(
        teacher.id,
        nextMonday.toISOString(),
        endTime.toISOString()
      );

      expect(result.isAvailable).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return unavailable when lesson is outside weekly schedule', async () => {
      // Monday 9:00-17:00 available
      const teacher = await createTestTeacher([
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ]);

      // Tuesday 10:00-11:00 lesson (not in schedule) (UTC)
      const nextTuesday = new Date();
      nextTuesday.setUTCDate(nextTuesday.getUTCDate() + ((2 + 7 - nextTuesday.getUTCDay()) % 7));
      nextTuesday.setUTCHours(10, 0, 0, 0);
      const endTime = new Date(nextTuesday);
      endTime.setUTCHours(11, 0, 0, 0);

      const result = await checkTeacherAvailability(
        teacher.id,
        nextTuesday.toISOString(),
        endTime.toISOString()
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('not available');
    });

    it('should return unavailable when lesson time exceeds weekly slot', async () => {
      // Monday 9:00-12:00 available
      const teacher = await createTestTeacher([
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      ]);

      // Monday 11:00-13:00 lesson (extends past 12:00) (UTC)
      const nextMonday = new Date();
      nextMonday.setUTCDate(nextMonday.getUTCDate() + ((1 + 7 - nextMonday.getUTCDay()) % 7));
      nextMonday.setUTCHours(11, 0, 0, 0);
      const endTime = new Date(nextMonday);
      endTime.setUTCHours(13, 0, 0, 0);

      const result = await checkTeacherAvailability(
        teacher.id,
        nextMonday.toISOString(),
        endTime.toISOString()
      );

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('Availability Exceptions', () => {
    it('should block time with unavailable exception (all day)', async () => {
      // Monday 9:00-17:00 available
      const teacher = await createTestTeacher(
        [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
        [{
          id: uuidv4(),
          type: 'unavailable',
          startDate: '2026-02-02', // A Monday
          endDate: '2026-02-02',
          reason: 'Sick day',
          allDay: true,
        }]
      );

      // Lesson on that Monday
      const lessonDate = new Date('2026-02-02T10:00:00.000Z');
      const endTime = new Date('2026-02-02T11:00:00.000Z');

      const result = await checkTeacherAvailability(
        teacher.id,
        lessonDate.toISOString(),
        endTime.toISOString()
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('Sick day');
    });

    it('should block time with unavailable exception (specific hours)', async () => {
      // Monday 9:00-17:00 available
      const teacher = await createTestTeacher(
        [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
        [{
          id: uuidv4(),
          type: 'unavailable',
          startDate: '2026-02-02',
          endDate: '2026-02-02',
          reason: 'Meeting',
          allDay: false,
          startTime: '14:00',
          endTime: '15:00',
        }]
      );

      // Lesson during meeting time
      const lessonDate = new Date('2026-02-02T14:00:00.000Z');
      const endTime = new Date('2026-02-02T14:30:00.000Z');

      const result = await checkTeacherAvailability(
        teacher.id,
        lessonDate.toISOString(),
        endTime.toISOString()
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('Meeting');
    });

    it('should allow time with available override exception', async () => {
      // No weekly availability on Tuesday (dayOfWeek=2)
      const teacher = await createTestTeacher(
        [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }], // Only Monday
        [{
          id: uuidv4(),
          type: 'available',
          startDate: '2026-02-03', // A Tuesday
          endDate: '2026-02-03',
          reason: 'Extra shift',
          allDay: true,
        }]
      );

      // Lesson on that Tuesday (normally unavailable)
      const lessonDate = new Date('2026-02-03T10:00:00.000Z');
      const endTime = new Date('2026-02-03T11:00:00.000Z');

      const result = await checkTeacherAvailability(
        teacher.id,
        lessonDate.toISOString(),
        endTime.toISOString()
      );

      expect(result.isAvailable).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should handle multi-day unavailable exception', async () => {
      // Monday-Friday available
      const teacher = await createTestTeacher(
        [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        ],
        [{
          id: uuidv4(),
          type: 'unavailable',
          startDate: '2026-02-02', // Monday
          endDate: '2026-02-04',   // Wednesday (3-day vacation)
          reason: 'Vacation',
          allDay: true,
        }]
      );

      // Tuesday during vacation
      const lessonDate = new Date('2026-02-03T10:00:00.000Z');
      const endTime = new Date('2026-02-03T11:00:00.000Z');

      const result = await checkTeacherAvailability(
        teacher.id,
        lessonDate.toISOString(),
        endTime.toISOString()
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('Vacation');
    });
  });
});
