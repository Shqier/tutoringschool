// ============================================
// TESTS: POST /api/lessons
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  createTestTeacher,
  createTestRoom,
  createTestGroup,
  createTestStudent,
  createTestLesson,
  createTestHeaders,
} from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

// ============================================
// HELPERS
// ============================================

function createRequest(
  body: any,
  headers: Record<string, string> = {},
  searchParams: Record<string, string> = {}
): NextRequest {
  const url = new URL('http://localhost:3000/api/lessons');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new NextRequest(url, {
    method: 'POST',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

function createGetRequest(
  searchParams: Record<string, string> = {},
  headers: Record<string, string> = {}
): NextRequest {
  const url = new URL('http://localhost:3000/api/lessons');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new NextRequest(url, {
    method: 'GET',
    headers: createTestHeaders(headers),
  });
}

// ============================================
// TEST SUITE: POST /api/lessons
// ============================================

describe('POST /api/lessons', () => {
  describe('Lesson Creation', () => {
    it('should create a lesson successfully', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom();
      const student = await createTestStudent();

      const lessonData = {
        title: 'Arabic Grammar Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student.id,
        teacherId: teacher.id,
        roomId: room.id,
        status: 'upcoming',
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(lessonData.title);
      expect(data.teacherId).toBe(teacher.id);
      expect(data.roomId).toBe(room.id);
      expect(data.studentId).toBe(student.id);
      expect(data.type).toBe('one_on_one');
      expect(data.status).toBe('upcoming');
      expect(data.orgId).toBe(DEFAULT_ORG_ID);
    });

    it('should create a group lesson successfully', async () => {
      const teacher = await createTestTeacher();
      const group = await createTestGroup(teacher.id);

      const lessonData = {
        title: 'Group Arabic Class',
        startAt: new Date('2026-02-01T14:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T15:30:00Z').toISOString(),
        type: 'group',
        groupId: group.id,
        teacherId: teacher.id,
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(lessonData.title);
      expect(data.type).toBe('group');
      expect(data.groupId).toBe(group.id);
      expect(data.teacherId).toBe(teacher.id);
    });

    it('should create a lesson without a room', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lessonData = {
        title: 'Virtual Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student.id,
        teacherId: teacher.id,
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.roomId).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should reject lesson with invalid teacher', async () => {
      const student = await createTestStudent();

      const lessonData = {
        title: 'Test Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student.id,
        teacherId: 'nonexistent-teacher-id',
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_TEACHER');
    });

    it('should reject lesson with invalid room', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lessonData = {
        title: 'Test Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student.id,
        teacherId: teacher.id,
        roomId: 'nonexistent-room-id',
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ROOM');
    });

    it('should reject lesson with room in maintenance', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom({ status: 'maintenance' });
      const student = await createTestStudent();

      const lessonData = {
        title: 'Test Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student.id,
        teacherId: teacher.id,
        roomId: room.id,
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('ROOM_UNAVAILABLE');
    });

    it('should reject lesson with invalid group', async () => {
      const teacher = await createTestTeacher();

      const lessonData = {
        title: 'Test Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'group',
        groupId: 'nonexistent-group-id',
        teacherId: teacher.id,
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_GROUP');
    });

    it('should reject lesson with invalid student', async () => {
      const teacher = await createTestTeacher();

      const lessonData = {
        title: 'Test Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: 'nonexistent-student-id',
        teacherId: teacher.id,
      };

      const request = createRequest(lessonData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_STUDENT');
    });
  });

  describe('Teacher Conflict Detection', () => {
    it('should return 409 when teacher has overlapping lesson', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create existing lesson from 10:00 to 11:00
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id }
      );

      // Try to create overlapping lesson from 10:30 to 11:30
      const conflictingLesson = {
        title: 'Conflicting Lesson',
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher.id,
      };

      const request = createRequest(conflictingLesson);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.conflicts.teacher).toHaveLength(1);
      expect(data.message).toContain('x-force-create');
    });

    it('should detect teacher conflict at exact same time', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create existing lesson from 10:00 to 11:00
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id }
      );

      // Try to create lesson at exact same time
      const conflictingLesson = {
        title: 'Same Time Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher.id,
      };

      const request = createRequest(conflictingLesson);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.conflicts.teacher).toHaveLength(1);
    });

    it('should detect teacher conflict when new lesson contains existing', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create existing lesson from 10:30 to 11:30
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:30:00Z'),
        new Date('2026-02-01T11:30:00Z'),
        { studentId: student1.id }
      );

      // Try to create lesson that contains the existing one (10:00 to 12:00)
      const conflictingLesson = {
        title: 'Containing Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T12:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher.id,
      };

      const request = createRequest(conflictingLesson);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.conflicts.teacher).toHaveLength(1);
    });

    it('should allow non-overlapping lessons for same teacher', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create existing lesson from 10:00 to 11:00
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id }
      );

      // Create non-overlapping lesson from 11:00 to 12:00
      const nonConflictingLesson = {
        title: 'Next Lesson',
        startAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T12:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher.id,
      };

      const request = createRequest(nonConflictingLesson);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should ignore cancelled lessons in conflict detection', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create cancelled lesson from 10:00 to 11:00
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id, status: 'cancelled' }
      );

      // Should be able to create overlapping lesson since existing is cancelled
      const newLesson = {
        title: 'New Lesson',
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher.id,
      };

      const request = createRequest(newLesson);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Room Conflict Detection', () => {
    it('should return 409 when room has overlapping lesson', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const room = await createTestRoom();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create existing lesson in room from 10:00 to 11:00
      await createTestLesson(
        teacher1.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id, roomId: room.id }
      );

      // Try to book same room with overlap
      const conflictingLesson = {
        title: 'Conflicting Room Lesson',
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher2.id,
        roomId: room.id,
      };

      const request = createRequest(conflictingLesson);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.conflicts.room).toHaveLength(1);
    });

    it('should allow overlapping lessons in different rooms', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const room1 = await createTestRoom();
      const room2 = await createTestRoom();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create lesson in room1
      await createTestLesson(
        teacher1.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id, roomId: room1.id }
      );

      // Create overlapping lesson in room2 - should succeed
      const newLesson = {
        title: 'Different Room Lesson',
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher2.id,
        roomId: room2.id,
      };

      const request = createRequest(newLesson);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Combined Conflicts', () => {
    it('should detect both teacher and room conflicts', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create existing lesson with teacher and room
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id, roomId: room.id }
      );

      // Try to create overlapping lesson with same teacher and room
      const conflictingLesson = {
        title: 'Double Conflict',
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher.id,
        roomId: room.id,
      };

      const request = createRequest(conflictingLesson);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.conflicts.teacher).toHaveLength(1);
      expect(data.conflicts.room).toHaveLength(1);
    });
  });

  describe('Force Create Override', () => {
    it('should create lesson with conflicts when x-force-create is true', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create existing lesson
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id }
      );

      // Create overlapping lesson with force flag
      const conflictingLesson = {
        title: 'Forced Lesson',
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student2.id,
        teacherId: teacher.id,
      };

      const request = createRequest(conflictingLesson, { 'x-force-create': 'true' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Forced Lesson');
    });
  });

  describe('Authorization', () => {
    it('should require teacher role or higher', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lessonData = {
        title: 'Test Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student.id,
        teacherId: teacher.id,
      };

      const request = createRequest(lessonData, { 'x-user-role': 'staff' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should allow teacher role', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lessonData = {
        title: 'Test Lesson',
        startAt: new Date('2026-02-01T10:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:00:00Z').toISOString(),
        type: 'one_on_one',
        studentId: student.id,
        teacherId: teacher.id,
      };

      const request = createRequest(lessonData, { 'x-user-role': 'teacher' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});

// ============================================
// TEST SUITE: GET /api/lessons
// ============================================

describe('GET /api/lessons', () => {
  describe('Basic Listing', () => {
    it('should return empty list when no lessons exist', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return lessons with enriched data', async () => {
      const teacher = await createTestTeacher({ fullName: 'John Doe' });
      const room = await createTestRoom({ name: 'Room A' });
      const group = await createTestGroup(teacher.id, { name: 'Group Alpha' });

      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { type: 'group', groupId: group.id, roomId: room.id, title: 'Test Lesson' }
      );

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].teacherName).toBe('John Doe');
      expect(data.data[0].roomName).toBe('Room A');
      expect(data.data[0].groupName).toBe('Group Alpha');
      expect(data.data[0].title).toBe('Test Lesson');
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter lessons by start date', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      // Create lesson on Feb 1
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, title: 'Early Lesson' }
      );

      // Create lesson on Feb 5
      await createTestLesson(
        teacher.id,
        new Date('2026-02-05T10:00:00Z'),
        new Date('2026-02-05T11:00:00Z'),
        { studentId: student.id, title: 'Later Lesson' }
      );

      // Filter for lessons starting from Feb 3
      const request = createGetRequest({
        startDate: new Date('2026-02-03T00:00:00Z').toISOString(),
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Later Lesson');
    });

    it('should filter lessons by end date', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      // Create lesson on Feb 1
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, title: 'Early Lesson' }
      );

      // Create lesson on Feb 5
      await createTestLesson(
        teacher.id,
        new Date('2026-02-05T10:00:00Z'),
        new Date('2026-02-05T11:00:00Z'),
        { studentId: student.id, title: 'Later Lesson' }
      );

      // Filter for lessons ending before Feb 3
      const request = createGetRequest({
        endDate: new Date('2026-02-03T00:00:00Z').toISOString(),
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Early Lesson');
    });

    it('should filter lessons by date range', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      // Create 3 lessons on different days
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, title: 'Day 1' }
      );

      await createTestLesson(
        teacher.id,
        new Date('2026-02-05T10:00:00Z'),
        new Date('2026-02-05T11:00:00Z'),
        { studentId: student.id, title: 'Day 5' }
      );

      await createTestLesson(
        teacher.id,
        new Date('2026-02-10T10:00:00Z'),
        new Date('2026-02-10T11:00:00Z'),
        { studentId: student.id, title: 'Day 10' }
      );

      // Filter for Feb 3 to Feb 7
      const request = createGetRequest({
        startDate: new Date('2026-02-03T00:00:00Z').toISOString(),
        endDate: new Date('2026-02-07T00:00:00Z').toISOString(),
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Day 5');
    });
  });

  describe('Status Filtering', () => {
    it('should filter lessons by status', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, status: 'upcoming' }
      );

      await createTestLesson(
        teacher.id,
        new Date('2026-02-02T10:00:00Z'),
        new Date('2026-02-02T11:00:00Z'),
        { studentId: student.id, status: 'completed' }
      );

      await createTestLesson(
        teacher.id,
        new Date('2026-02-03T10:00:00Z'),
        new Date('2026-02-03T11:00:00Z'),
        { studentId: student.id, status: 'cancelled' }
      );

      // Filter for upcoming only
      const request = createGetRequest({ status: 'upcoming' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('upcoming');
    });
  });

  describe('Teacher and Room Filtering', () => {
    it('should filter lessons by teacherId', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const student = await createTestStudent();

      await createTestLesson(
        teacher1.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, title: 'Teacher 1 Lesson' }
      );

      await createTestLesson(
        teacher2.id,
        new Date('2026-02-01T14:00:00Z'),
        new Date('2026-02-01T15:00:00Z'),
        { studentId: student.id, title: 'Teacher 2 Lesson' }
      );

      const request = createGetRequest({ teacherId: teacher1.id });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].teacherId).toBe(teacher1.id);
    });

    it('should filter lessons by roomId', async () => {
      const teacher = await createTestTeacher();
      const room1 = await createTestRoom();
      const room2 = await createTestRoom();
      const student = await createTestStudent();

      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, roomId: room1.id }
      );

      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T14:00:00Z'),
        new Date('2026-02-01T15:00:00Z'),
        { studentId: student.id, roomId: room2.id }
      );

      const request = createGetRequest({ roomId: room1.id });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].roomId).toBe(room1.id);
    });

    it('should filter lessons by groupId', async () => {
      const teacher = await createTestTeacher();
      const group1 = await createTestGroup(teacher.id);
      const group2 = await createTestGroup(teacher.id);

      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { type: 'group', groupId: group1.id }
      );

      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T14:00:00Z'),
        new Date('2026-02-01T15:00:00Z'),
        { type: 'group', groupId: group2.id }
      );

      const request = createGetRequest({ groupId: group1.id });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].groupId).toBe(group1.id);
    });
  });

  describe('Pagination', () => {
    it('should paginate results', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      // Create 5 lessons
      for (let i = 0; i < 5; i++) {
        await createTestLesson(
          teacher.id,
          new Date(`2026-02-0${i + 1}T10:00:00Z`),
          new Date(`2026-02-0${i + 1}T11:00:00Z`),
          { studentId: student.id }
        );
      }

      // Get first page with limit 2
      const request = createGetRequest({ page: '1', limit: '2' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.pagination.total).toBe(5);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should return second page correctly', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      // Create 5 lessons
      for (let i = 0; i < 5; i++) {
        await createTestLesson(
          teacher.id,
          new Date(`2026-02-0${i + 1}T10:00:00Z`),
          new Date(`2026-02-0${i + 1}T11:00:00Z`),
          { studentId: student.id }
        );
      }

      // Get second page
      const request = createGetRequest({ page: '2', limit: '2' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.hasMore).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should require staff role or higher', async () => {
      const request = createGetRequest({}, { 'x-user-role': 'unauthorized' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should allow staff role', async () => {
      const request = createGetRequest({}, { 'x-user-role': 'staff' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Availability Enforcement', () => {
    it('should reject lesson when teacher not available (weekly schedule)', async () => {
      // Create teacher available only Monday 9-17
      const teacher = await createTestTeacher({
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
      });

      const group = await createTestGroup(teacher.id);

      // Try to schedule on Tuesday
      const nextTuesday = new Date();
      nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7));
      nextTuesday.setHours(10, 0, 0, 0);
      const endTime = new Date(nextTuesday);
      endTime.setHours(11, 0, 0, 0);

      const response = await POST(
        new NextRequest('http://localhost:3000/api/lessons', {
          method: 'POST',
          headers: createTestHeaders(),
          body: JSON.stringify({
            title: 'Test Lesson',
            startAt: nextTuesday.toISOString(),
            endAt: endTime.toISOString(),
            type: 'group',
            groupId: group.id,
            teacherId: teacher.id,
          }),
        })
      );

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.conflicts?.availability).toBeDefined();
    });

    it('should reject lesson during unavailable exception', async () => {
      // Create teacher with vacation exception
      const teacher = await createTestTeacher({
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
        availabilityExceptions: [
          {
            id: uuidv4(),
            type: 'unavailable',
            startDate: '2026-02-02',
            endDate: '2026-02-02',
            reason: 'Vacation',
            allDay: true,
          },
        ],
      });

      const group = await createTestGroup(teacher.id);

      // Try to schedule during vacation
      const lessonDate = new Date('2026-02-02T10:00:00.000Z');
      const endTime = new Date('2026-02-02T11:00:00.000Z');

      const response = await POST(
        new NextRequest('http://localhost:3000/api/lessons', {
          method: 'POST',
          headers: createTestHeaders(),
          body: JSON.stringify({
            title: 'Test Lesson',
            startAt: lessonDate.toISOString(),
            endAt: endTime.toISOString(),
            type: 'group',
            groupId: group.id,
            teacherId: teacher.id,
          }),
        })
      );

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.conflicts?.availability).toBeDefined();
      expect(data.conflicts.availability[0]).toContain('Vacation');
    });

    it('should allow lesson with force-create header despite availability conflict', async () => {
      // Create teacher not available on Tuesday
      const teacher = await createTestTeacher({
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
      });

      const group = await createTestGroup(teacher.id);

      // Try to schedule on Tuesday with force flag
      const nextTuesday = new Date();
      nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7));
      nextTuesday.setHours(10, 0, 0, 0);
      const endTime = new Date(nextTuesday);
      endTime.setHours(11, 0, 0, 0);

      const headers = createTestHeaders();
      headers['x-force-create'] = 'true';

      const response = await POST(
        new NextRequest('http://localhost:3000/api/lessons', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: 'Test Lesson',
            startAt: nextTuesday.toISOString(),
            endAt: endTime.toISOString(),
            type: 'group',
            groupId: group.id,
            teacherId: teacher.id,
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
    });

    it('should allow lesson with available override exception', async () => {
      // Create teacher with available override on Tuesday
      const teacher = await createTestTeacher({
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
        availabilityExceptions: [
          {
            id: uuidv4(),
            type: 'available',
            startDate: '2026-02-03',
            endDate: '2026-02-03',
            reason: 'Extra shift',
            allDay: true,
          },
        ],
      });

      const group = await createTestGroup(teacher.id);

      // Schedule on that Tuesday (with override)
      const lessonDate = new Date('2026-02-03T10:00:00.000Z');
      const endTime = new Date('2026-02-03T11:00:00.000Z');

      const response = await POST(
        new NextRequest('http://localhost:3000/api/lessons', {
          method: 'POST',
          headers: createTestHeaders(),
          body: JSON.stringify({
            title: 'Test Lesson',
            startAt: lessonDate.toISOString(),
            endAt: endTime.toISOString(),
            type: 'group',
            groupId: group.id,
            teacherId: teacher.id,
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
    });
  });
});
