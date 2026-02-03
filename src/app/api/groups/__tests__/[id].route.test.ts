// ============================================
// TESTS: GET, PATCH, DELETE, PUT /api/groups/[id]
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE, PUT } from '../[id]/route';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  createTestTeacher,
  createTestRoom,
  createTestStudent,
  createTestHeaders,
  cleanDatabase,
} from '@/lib/test/db-helpers';
import { prisma } from '@/lib/db/prisma';

// ============================================
// HELPERS
// ============================================

async function createTestGroup(overrides: any = {}) {
  const teacher = overrides.teacher || await createTestTeacher();
  const defaultData = {
    name: `Test Group ${uuidv4().substring(0, 8)}`,
    teacherId: teacher.id,
    studentIds: [],
  };

  const request = new NextRequest('http://localhost:3000/api/groups', {
    method: 'POST',
    headers: createTestHeaders({ 'x-user-role': 'manager' }),
    body: JSON.stringify({ ...defaultData, ...overrides }),
  });

  const response = await POST(request);
  return await response.json();
}

function createGetRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/groups/${id}`, {
    method: 'GET',
    headers: createTestHeaders(headers),
  });
}

function createPatchRequest(
  id: string,
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000/api/groups/${id}`, {
    method: 'PATCH',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/groups/${id}`, {
    method: 'DELETE',
    headers: createTestHeaders(headers),
  });
}

function createPutRequest(
  id: string,
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000/api/groups/${id}`, {
    method: 'PUT',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

async function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ============================================
// TEST SUITE: GET /api/groups/[id]
// ============================================

describe('GET /api/groups/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should allow staff role', async () => {
      const group = await createTestGroup();
      const request = createGetRequest(group.id, { 'x-user-role': 'staff' });
      const response = await GET(request, await mockParams(group.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Retrieval', () => {
    it('should get group by ID successfully', async () => {
      const teacher = await createTestTeacher({ fullName: 'Ahmed Hassan' });
      const room = await createTestRoom({ name: 'Room A' });
      const student = await createTestStudent();

      const group = await createTestGroup({
        name: 'Arabic A1',
        teacher,
        teacherId: teacher.id,
        roomId: room.id,
        studentIds: [student.id],
        color: '#F5A623',
      });

      const request = createGetRequest(group.id);
      const response = await GET(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(group.id);
      expect(data.name).toBe('Arabic A1');
      expect(data.color).toBe('#F5A623');
      expect(data.teacher).toBeDefined();
      expect(data.teacher.fullName).toBe('Ahmed Hassan');
      expect(data.room).toBeDefined();
      expect(data.room.name).toBe('Room A');
      expect(data.students).toHaveLength(1);
      expect(data.studentsCount).toBe(1);
    });

    it('should return 404 for non-existent group', async () => {
      const request = createGetRequest('non-existent-id');
      const response = await GET(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });

    it('should include students array', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      const group = await createTestGroup({
        teacherId: teacher.id,
        studentIds: [student1.id, student2.id],
      });

      const request = createGetRequest(group.id);
      const response = await GET(request, await mockParams(group.id));
      const data = await response.json();

      expect(data.students).toHaveLength(2);
      expect(data.students.map((s: any) => s.id)).toContain(student1.id);
      expect(data.students.map((s: any) => s.id)).toContain(student2.id);
    });
  });
});

// ============================================
// TEST SUITE: PATCH /api/groups/[id]
// ============================================

describe('PATCH /api/groups/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const group = await createTestGroup();
      const request = createPatchRequest(
        group.id,
        { name: 'Updated' },
        { 'x-user-role': 'staff' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      expect(response.status).toBe(403);
    });

    it('should allow manager role', async () => {
      const group = await createTestGroup();
      const request = createPatchRequest(
        group.id,
        { name: 'Updated Name' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      expect(response.status).toBe(200);
    });

    it('should allow admin role', async () => {
      const group = await createTestGroup();
      const request = createPatchRequest(
        group.id,
        { name: 'Updated Name' },
        { 'x-user-role': 'admin' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Updates', () => {
    it('should update group name', async () => {
      const group = await createTestGroup({ name: 'Original Name' });

      const request = createPatchRequest(
        group.id,
        { name: 'Updated Name' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
    });

    it('should update teacherId', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const group = await createTestGroup({ teacherId: teacher1.id });

      const request = createPatchRequest(
        group.id,
        { teacherId: teacher2.id },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.teacherId).toBe(teacher2.id);
    });

    it('should update roomId', async () => {
      const group = await createTestGroup();
      const newRoom = await createTestRoom();

      const request = createPatchRequest(
        group.id,
        { roomId: newRoom.id },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roomId).toBe(newRoom.id);
    });

    it('should update color', async () => {
      const group = await createTestGroup({ color: '#FF0000' });

      const request = createPatchRequest(
        group.id,
        { color: '#00FF00' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.color).toBe('#00FF00');
    });

    it('should update multiple fields at once', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom();
      const group = await createTestGroup();

      const request = createPatchRequest(
        group.id,
        {
          name: 'New Name',
          teacherId: teacher.id,
          roomId: room.id,
          color: '#123456',
        },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('New Name');
      expect(data.teacherId).toBe(teacher.id);
      expect(data.roomId).toBe(room.id);
      expect(data.color).toBe('#123456');
    });

    it('should return 404 for non-existent group', async () => {
      const request = createPatchRequest(
        'non-existent-id',
        { name: 'Updated' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Student Assignment via PATCH', () => {
    it('should update studentIds', async () => {
      const group = await createTestGroup({ studentIds: [] });
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      const request = createPatchRequest(
        group.id,
        { studentIds: [student1.id, student2.id] },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.studentIds).toHaveLength(2);
      expect(data.studentIds).toContain(student1.id);
      expect(data.studentIds).toContain(student2.id);
    });

    it('should add group to new students groupIds', async () => {
      const group = await createTestGroup({ studentIds: [] });
      const student = await createTestStudent();

      await PATCH(
        createPatchRequest(
          group.id,
          { studentIds: [student.id] },
          { 'x-user-role': 'manager' }
        ),
        await mockParams(group.id)
      );

      // Verify student has group in groupIds
      const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(updatedStudent?.groupIds).toContain(group.id);
    });

    it('should remove group from students no longer in group', async () => {
      const student = await createTestStudent();
      const group = await createTestGroup({ studentIds: [student.id] });

      // Remove student from group
      await PATCH(
        createPatchRequest(
          group.id,
          { studentIds: [] },
          { 'x-user-role': 'manager' }
        ),
        await mockParams(group.id)
      );

      // Verify student no longer has group in groupIds
      const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(updatedStudent?.groupIds).not.toContain(group.id);
    });
  });

  describe('Duplicate Name', () => {
    it('should reject name that already exists for another group', async () => {
      const group1 = await createTestGroup({ name: 'Group 1' });
      const group2 = await createTestGroup({ name: 'Group 2' });

      // Try to update group2's name to group1's name
      const request = createPatchRequest(
        group2.id,
        { name: 'Group 1' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group2.id));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error?.code).toBe('DUPLICATE_NAME');
    });

    it('should allow keeping the same name (no change)', async () => {
      const group = await createTestGroup({ name: 'Same Name' });

      const request = createPatchRequest(
        group.id,
        { name: 'Same Name', color: '#123456' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));

      expect(response.status).toBe(200);
    });
  });

  describe('Schedule Rule', () => {
    it('should update schedule rule', async () => {
      // Create group without schedule rule (omitted)
      const teacher = await createTestTeacher();
      const group = await createTestGroup({ teacherId: teacher.id });

      const scheduleRule = {
        daysOfWeek: [1, 3, 5],
        startTime: '14:00',
        endTime: '15:30',
      };

      const request = createPatchRequest(
        group.id,
        { scheduleRule },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.scheduleRule).toEqual(scheduleRule);
    });

    it('should update existing schedule rule', async () => {
      const group = await createTestGroup({
        scheduleRule: {
          daysOfWeek: [1, 3],
          startTime: '10:00',
          endTime: '11:00',
        },
      });

      const newScheduleRule = {
        daysOfWeek: [2, 4],
        startTime: '14:00',
        endTime: '16:00',
      };

      const request = createPatchRequest(
        group.id,
        { scheduleRule: newScheduleRule },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.scheduleRule).toEqual(newScheduleRule);
    });
  });

  describe('Validation', () => {
    it('should reject invalid teacher', async () => {
      const group = await createTestGroup();

      const request = createPatchRequest(
        group.id,
        { teacherId: 'nonexistent-teacher-id' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error?.code).toBe('INVALID_TEACHER');
    });

    it('should reject invalid room', async () => {
      const group = await createTestGroup();

      const request = createPatchRequest(
        group.id,
        { roomId: 'nonexistent-room-id' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error?.code).toBe('INVALID_ROOM');
    });
  });
});

// ============================================
// TEST SUITE: DELETE /api/groups/[id]
// ============================================

describe('DELETE /api/groups/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const group = await createTestGroup();
      const request = createDeleteRequest(group.id, { 'x-user-role': 'staff' });
      const response = await DELETE(request, await mockParams(group.id));
      expect(response.status).toBe(403);
    });

    it('should reject manager role', async () => {
      const group = await createTestGroup();
      const request = createDeleteRequest(group.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(group.id));
      expect(response.status).toBe(403);
    });

    it('should allow admin role', async () => {
      const group = await createTestGroup();
      const request = createDeleteRequest(group.id, { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams(group.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Deletion', () => {
    it('should delete group successfully', async () => {
      const group = await createTestGroup({ name: 'To Delete' });

      const request = createDeleteRequest(group.id, { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deletedId).toBe(group.id);

      // Verify group is deleted
      const deletedGroup = await prisma.group.findUnique({ where: { id: group.id } });
      expect(deletedGroup).toBeNull();
    });

    it('should remove group from students when deleted', async () => {
      const student = await createTestStudent();
      const group = await createTestGroup({ studentIds: [student.id] });

      const request = createDeleteRequest(group.id, { 'x-user-role': 'admin' });
      await DELETE(request, await mockParams(group.id));

      // Verify student no longer has group in groupIds
      const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(updatedStudent?.groupIds).not.toContain(group.id);
    });

    it('should return 404 for non-existent group', async () => {
      const request = createDeleteRequest('non-existent-id', { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });
  });
});

// ============================================
// TEST SUITE: PUT /api/groups/[id] (Assign Students)
// ============================================

describe('PUT /api/groups/[id] (Assign Students)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const group = await createTestGroup();
      const request = createPutRequest(
        group.id,
        { studentIds: [] },
        { 'x-user-role': 'staff' }
      );
      const response = await PUT(request, await mockParams(group.id));
      expect(response.status).toBe(403);
    });

    it('should allow manager role', async () => {
      const group = await createTestGroup();
      const request = createPutRequest(
        group.id,
        { studentIds: [] },
        { 'x-user-role': 'manager' }
      );
      const response = await PUT(request, await mockParams(group.id));
      expect(response.status).toBe(200);
    });

    it('should allow admin role', async () => {
      const group = await createTestGroup();
      const request = createPutRequest(
        group.id,
        { studentIds: [] },
        { 'x-user-role': 'admin' }
      );
      const response = await PUT(request, await mockParams(group.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Student Assignment', () => {
    it('should assign students to group', async () => {
      const group = await createTestGroup({ studentIds: [] });
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      const request = createPutRequest(
        group.id,
        { studentIds: [student1.id, student2.id] },
        { 'x-user-role': 'manager' }
      );
      const response = await PUT(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.studentIds).toHaveLength(2);
      expect(data.studentIds).toContain(student1.id);
      expect(data.studentIds).toContain(student2.id);
    });

    it('should update students groupIds when assigned', async () => {
      const group = await createTestGroup({ studentIds: [] });
      const student = await createTestStudent();

      await PUT(
        createPutRequest(
          group.id,
          { studentIds: [student.id] },
          { 'x-user-role': 'manager' }
        ),
        await mockParams(group.id)
      );

      // Verify student has group in groupIds
      const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(updatedStudent?.groupIds).toContain(group.id);
    });

    it('should remove group from unassigned students', async () => {
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();
      const group = await createTestGroup({ studentIds: [student1.id, student2.id] });

      // Remove student1, keep student2
      await PUT(
        createPutRequest(
          group.id,
          { studentIds: [student2.id] },
          { 'x-user-role': 'manager' }
        ),
        await mockParams(group.id)
      );

      // Verify student1 no longer has group
      const updatedStudent1 = await prisma.student.findUnique({ where: { id: student1.id } });
      expect(updatedStudent1?.groupIds).not.toContain(group.id);

      // Verify student2 still has group
      const updatedStudent2 = await prisma.student.findUnique({ where: { id: student2.id } });
      expect(updatedStudent2?.groupIds).toContain(group.id);
    });

    it('should clear all students with empty array', async () => {
      const student = await createTestStudent();
      const group = await createTestGroup({ studentIds: [student.id] });

      await PUT(
        createPutRequest(
          group.id,
          { studentIds: [] },
          { 'x-user-role': 'manager' }
        ),
        await mockParams(group.id)
      );

      // Verify group has no students
      const updatedGroup = await prisma.group.findUnique({ where: { id: group.id } });
      expect(updatedGroup?.studentIds).toHaveLength(0);

      // Verify student no longer has group
      const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(updatedStudent?.groupIds).not.toContain(group.id);
    });

    it('should return 404 for non-existent group', async () => {
      const request = createPutRequest(
        'non-existent-id',
        { studentIds: [] },
        { 'x-user-role': 'manager' }
      );
      const response = await PUT(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Validation', () => {
    it('should reject invalid students', async () => {
      const group = await createTestGroup();
      const student = await createTestStudent();

      const request = createPutRequest(
        group.id,
        { studentIds: [student.id, 'nonexistent-student-id'] },
        { 'x-user-role': 'manager' }
      );
      const response = await PUT(request, await mockParams(group.id));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error?.code).toBe('INVALID_STUDENT');
    });

    it('should handle same student assigned multiple times gracefully', async () => {
      const group = await createTestGroup({ studentIds: [] });
      const student = await createTestStudent();

      // Assign student once
      const response1 = await PUT(
        createPutRequest(
          group.id,
          { studentIds: [student.id] },
          { 'x-user-role': 'manager' }
        ),
        await mockParams(group.id)
      );
      expect(response1.status).toBe(200);

      // Assign same student again (idempotent)
      const response2 = await PUT(
        createPutRequest(
          group.id,
          { studentIds: [student.id] },
          { 'x-user-role': 'manager' }
        ),
        await mockParams(group.id)
      );
      expect(response2.status).toBe(200);

      // Verify student still has group only once
      const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
      const groupIdCount = updatedStudent?.groupIds.filter(gid => gid === group.id).length;
      expect(groupIdCount).toBe(1);
    });
  });
});
