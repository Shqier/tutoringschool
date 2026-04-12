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
    await prisma.attendance.deleteMany({});
    await prisma.lessonCredit.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.studentSubscription.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.paymentPlan.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.organization.deleteMany({});
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Create a test teacher
 */
export async function createTestTeacher(overrides: any = {}) {
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
export async function createTestRoom(overrides: any = {}) {
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
export async function createTestGroup(teacherId: string, overrides: any = {}) {
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
 * Create a test payment plan
 */
export async function createTestPaymentPlan(overrides: any = {}) {
  const randomId = Math.random().toString(36).substring(7);
  return await prisma.paymentPlan.create({
    data: {
      name: `Test Plan ${randomId}`,
      tier: 'elementary',
      type: 'subscription',
      lessonsPerMonth: 8,
      monthlyPrice: 550,
      lessonPrice: null,
      duration: 60,
      orgId: DEFAULT_ORG_ID,
      isActive: true,
      ...overrides,
    },
  });
}

/**
 * Create a test student
 */
export async function createTestStudent(overrides: any = {}) {
  const randomId = Math.random().toString(36).substring(7);
  return await prisma.student.create({
    data: {
      fullName: `Test Student ${randomId}`,
      email: `student_${randomId}_${Date.now()}@test.com`,
      status: 'active',
      groupIds: [],
      attendancePercent: 0,
      grade: 5,
      paymentStatus: 'active',
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
  overrides: any = {}
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
