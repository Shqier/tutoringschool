// ============================================
// TESTS: GET & POST /api/groups
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  createTestTeacher,
  createTestRoom,
  createTestStudent,
  createTestHeaders,
  cleanDatabase,
} from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';
import { prisma } from '@/lib/db/prisma';

// ============================================
// HELPERS
// ============================================

function createGetRequest(
  searchParams: Record<string, string> = {},
  headers: Record<string, string> = {}
): NextRequest {
  const url = new URL('http://localhost:3000/api/groups');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new NextRequest(url, {
    method: 'GET',
    headers: createTestHeaders(headers),
  });
}

function createPostRequest(
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest('http://localhost:3000/api/groups', {
    method: 'POST',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

// ============================================
// TEST SUITE: GET /api/groups
// ============================================

describe('GET /api/groups', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should allow staff role', async () => {
      const request = createGetRequest({}, { 'x-user-role': 'staff' });
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should allow manager role', async () => {
      const request = createGetRequest({}, { 'x-user-role': 'manager' });
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should allow admin role', async () => {
      const request = createGetRequest({}, { 'x-user-role': 'admin' });
      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Listing', () => {
    it('should return empty array when no groups exist', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return all groups for organization', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom();

      // Create two groups via POST
      await POST(createPostRequest({
        name: 'Arabic A1',
        teacherId: teacher.id,
        roomId: room.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));

      await POST(createPostRequest({
        name: 'Arabic A2',
        teacherId: teacher.id,
        roomId: room.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should include enriched data (teacherName, roomName, studentsCount)', async () => {
      const teacher = await createTestTeacher({ fullName: 'Ahmed Hassan' });
      const room = await createTestRoom({ name: 'Room A' });

      await POST(createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        roomId: room.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0].teacherName).toBe('Ahmed Hassan');
      expect(data.data[0].roomName).toBe('Room A');
      expect(data.data[0].studentsCount).toBe(0);
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      const teacher = await createTestTeacher();
      // Create 15 groups
      for (let i = 1; i <= 15; i++) {
        await POST(createPostRequest({
          name: `Group ${i}`,
          teacherId: teacher.id,
          studentIds: [],
        }, { 'x-user-role': 'manager' }));
      }
    });

    it('should paginate results with default limit', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(15); // All 15 groups (under default limit of 20)
      expect(data.pagination.total).toBe(15);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
    });

    it('should respect custom page and limit', async () => {
      const request = createGetRequest({ page: '2', limit: '5' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(5);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
    });

    it('should handle page beyond available data', async () => {
      const request = createGetRequest({ page: '10', limit: '10' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(0);
      expect(data.pagination.total).toBe(15);
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      const teacher1 = await createTestTeacher({ fullName: 'Teacher 1' });
      const teacher2 = await createTestTeacher({ fullName: 'Teacher 2' });

      await POST(createPostRequest({
        name: 'Group A',
        teacherId: teacher1.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));

      await POST(createPostRequest({
        name: 'Group B',
        teacherId: teacher2.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));

      await POST(createPostRequest({
        name: 'Group C',
        teacherId: teacher1.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));
    });

    it('should filter by teacherId', async () => {
      const groups = await prisma.group.findMany();
      const teacher1Groups = groups.filter(g => g.name === 'Group A' || g.name === 'Group C');
      const teacherId = teacher1Groups[0].teacherId;

      const request = createGetRequest({ teacherId });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(data.data.every((g: any) => g.teacherId === teacherId)).toBe(true);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      const teacher = await createTestTeacher();

      await POST(createPostRequest({
        name: 'Arabic Beginners A1',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));

      await POST(createPostRequest({
        name: 'Quran Memorization',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));
    });

    it('should search by name (case insensitive)', async () => {
      const request = createGetRequest({ search: 'arabic' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Arabic Beginners A1');
    });

    it('should search by partial name', async () => {
      const request = createGetRequest({ search: 'quran' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Quran Memorization');
    });

    it('should return empty array when no matches', async () => {
      const request = createGetRequest({ search: 'nonexistent' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(0);
    });
  });
});

// ============================================
// TEST SUITE: POST /api/groups
// ============================================

describe('POST /api/groups', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const teacher = await createTestTeacher();
      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'staff' });
      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should allow manager role', async () => {
      const teacher = await createTestTeacher();
      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should allow admin role', async () => {
      const teacher = await createTestTeacher();
      const request = createPostRequest({
        name: 'Admin Group',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'admin' });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Creation', () => {
    it('should create a group successfully', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      const groupData = {
        name: 'Arabic A1',
        teacherId: teacher.id,
        roomId: room.id,
        studentIds: [student1.id, student2.id],
        scheduleRule: {
          daysOfWeek: [1, 3, 5],
          startTime: '10:00',
          endTime: '11:30',
        },
        color: '#F5A623',
      };

      const request = createPostRequest(groupData, { 'x-user-role': 'manager' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe(groupData.name);
      expect(data.teacherId).toBe(teacher.id);
      expect(data.roomId).toBe(room.id);
      expect(data.studentIds).toEqual([student1.id, student2.id]);
      expect(data.color).toBe(groupData.color);
      expect(data.orgId).toBe(DEFAULT_ORG_ID);
      expect(data.id).toBeDefined();
    });

    it('should create group without room (optional field)', async () => {
      const teacher = await createTestTeacher();

      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.roomId).toBeNull();
    });

    it('should create group with empty studentIds array', async () => {
      const teacher = await createTestTeacher();

      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.studentIds).toEqual([]);
    });

    it('should update students groupIds when assigned to group', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [student.id],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      // Verify student has group in their groupIds
      const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(updatedStudent?.groupIds).toContain(data.id);
    });
  });

  describe('Validation', () => {
    it('should reject missing name', async () => {
      const teacher = await createTestTeacher();
      const request = createPostRequest({
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject missing teacherId', async () => {
      const request = createPostRequest({
        name: 'Test Group',
        studentIds: [],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid teacher', async () => {
      const request = createPostRequest({
        name: 'Test Group',
        teacherId: 'nonexistent-teacher-id',
        studentIds: [],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error?.code).toBe('INVALID_TEACHER');
    });

    it('should reject invalid room', async () => {
      const teacher = await createTestTeacher();
      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        roomId: 'nonexistent-room-id',
        studentIds: [],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error?.code).toBe('INVALID_ROOM');
    });

    it('should reject invalid students', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [student.id, 'nonexistent-student-id'],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error?.code).toBe('INVALID_STUDENT');
    });
  });

  describe('Duplicate Name', () => {
    it('should reject duplicate name in same organization', async () => {
      const teacher = await createTestTeacher();

      // Create first group
      await POST(createPostRequest({
        name: 'Duplicate Group',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' }));

      // Try to create second group with same name
      const request = createPostRequest({
        name: 'Duplicate Group',
        teacherId: teacher.id,
        studentIds: [],
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error?.code).toBe('DUPLICATE_NAME');
    });
  });

  describe('Schedule Rule', () => {
    it('should accept schedule rule', async () => {
      const teacher = await createTestTeacher();
      const scheduleRule = {
        daysOfWeek: [1, 3, 5],
        startTime: '09:00',
        endTime: '10:30',
      };

      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [],
        scheduleRule,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.scheduleRule).toEqual(scheduleRule);
    });

    it('should accept omitted schedule rule', async () => {
      const teacher = await createTestTeacher();

      const request = createPostRequest({
        name: 'Test Group',
        teacherId: teacher.id,
        studentIds: [],
        // scheduleRule omitted
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.scheduleRule).toBeNull();
    });
  });
});
