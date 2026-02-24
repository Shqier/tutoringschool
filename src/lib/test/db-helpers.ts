// ============================================
// DATABASE TEST HELPERS
// ============================================

import { prisma } from '../db/prisma';
import { DEFAULT_ORG_ID } from '../db/seed-prisma';

/**
 * Clean all data from the database
 * Deletes data in the correct order to respect foreign key constraints
 */
export async function cleanDatabase(): Promise<void> {
  // Delete in reverse order of dependencies
  try {
    await prisma.lesson.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.approval.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Create a test teacher
 */
export async function createTestTeacher(overrides: Record<string, unknown> = {}) {
  const randomId = Math.random().toString(36).substring(7);
  return await prisma.teacher.create({
    data: {
      fullName: 'Test Teacher',
      email: `teacher_${randomId}_${Date.now()}@test.com`,
      subjects: ['Math'],
      status: 'active',
      weeklyAvailability: [
        // Default: Available all days 0:00-23:59 for testing
        { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' },
        { dayOfWeek: 1, startTime: '00:00', endTime: '23:59' },
        { dayOfWeek: 2, startTime: '00:00', endTime: '23:59' },
        { dayOfWeek: 3, startTime: '00:00', endTime: '23:59' },
        { dayOfWeek: 4, startTime: '00:00', endTime: '23:59' },
        { dayOfWeek: 5, startTime: '00:00', endTime: '23:59' },
        { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' },
      ],
      hoursThisWeek: 0,
      maxHours: 25,
      orgId: DEFAULT_ORG_ID,
      ...overrides,
    },
  });
}

/**
 * Create a test room
 */
export async function createTestRoom(overrides: Record<string, unknown> = {}) {
  const randomId = Math.random().toString(36).substring(7);
  return await prisma.room.create({
    data: {
      name: `Test Room ${randomId}`,
      capacity: 20,
      status: 'available',
      equipment: [],
      orgId: DEFAULT_ORG_ID,
      ...overrides,
    },
  });
}

/**
 * Create a test group
 */
export async function createTestGroup(teacherId: string, overrides: Record<string, unknown> = {}) {
  const randomId = Math.random().toString(36).substring(7);
  return await prisma.group.create({
    data: {
      name: `Test Group ${randomId}`,
      teacherId,
      studentIds: [],
      orgId: DEFAULT_ORG_ID,
      ...overrides,
    },
  });
}

/**
 * Create a test student
 */
export async function createTestStudent(overrides: Record<string, unknown> = {}) {
  const randomId = Math.random().toString(36).substring(7);
  return await prisma.student.create({
    data: {
      fullName: `Test Student ${randomId}`,
      email: `student_${randomId}_${Date.now()}@test.com`,
      status: 'active',
      groupIds: [],
      attendancePercent: 0,
      balance: 0,
      plan: 'Monthly Basic',
      enrolledDate: new Date(),
      orgId: DEFAULT_ORG_ID,
      ...overrides,
    },
  });
}

/**
 * Create a test lesson
 */
export async function createTestLesson(
  teacherId: string,
  startAt: Date,
  endAt: Date,
  overrides: Record<string, unknown> = {}
) {
  return await prisma.lesson.create({
    data: {
      title: 'Test Lesson',
      startAt,
      endAt,
      type: 'one_on_one',
      teacherId,
      status: 'upcoming',
      orgId: DEFAULT_ORG_ID,
      ...overrides,
    },
  });
}

/**
 * Create default test headers
 */
export function createTestHeaders(overrides: Record<string, string> = {}) {
  return {
    'x-user-role': 'admin',
    'x-user-id': 'user_test',
    'x-org-id': DEFAULT_ORG_ID,
    'Content-Type': 'application/json',
    ...overrides,
  };
}
