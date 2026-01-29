// ============================================
// TESTS: PATCH /api/lessons/:id
// ============================================

import { describe, it, expect } from 'vitest';
import { PATCH, DELETE, GET } from '../[id]/route';
import { NextRequest } from 'next/server';
import {
  createTestTeacher,
  createTestRoom,
  createTestStudent,
  createTestLesson,
  createTestHeaders,
} from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

// ============================================
// HELPERS
// ============================================

function createPatchRequest(
  id: string,
  body: any,
  headers: Record<string, string> = {}
): { request: NextRequest; params: { params: Promise<{ id: string }> } } {
  const url = new URL(`http://localhost:3000/api/lessons/${id}`);

  return {
    request: new NextRequest(url, {
      method: 'PATCH',
      headers: createTestHeaders(headers),
      body: JSON.stringify(body),
    }),
    params: { params: Promise.resolve({ id }) },
  };
}

function createDeleteRequest(
  id: string,
  headers: Record<string, string> = {}
): { request: NextRequest; params: { params: Promise<{ id: string }> } } {
  const url = new URL(`http://localhost:3000/api/lessons/${id}`);

  return {
    request: new NextRequest(url, {
      method: 'DELETE',
      headers: createTestHeaders(headers),
    }),
    params: { params: Promise.resolve({ id }) },
  };
}

function createGetRequestForId(
  id: string,
  headers: Record<string, string> = {}
): { request: NextRequest; params: { params: Promise<{ id: string }> } } {
  const url = new URL(`http://localhost:3000/api/lessons/${id}`);

  return {
    request: new NextRequest(url, {
      method: 'GET',
      headers: createTestHeaders(headers),
    }),
    params: { params: Promise.resolve({ id }) },
  };
}

// ============================================
// TEST SUITE: PATCH /api/lessons/:id
// ============================================

describe('PATCH /api/lessons/:id', () => {
  describe('Basic Updates', () => {
    it('should update lesson title', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();
      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, title: 'Old Title' }
      );

      const { request, params } = createPatchRequest(lesson.id, {
        title: 'New Title',
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('New Title');
      expect(data.id).toBe(lesson.id);
    });

    it('should update lesson status', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();
      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, status: 'upcoming' }
      );

      const { request, params } = createPatchRequest(lesson.id, {
        status: 'completed',
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
    });

    it('should update multiple fields at once', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();
      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, title: 'Old Title', status: 'upcoming' }
      );

      const { request, params } = createPatchRequest(lesson.id, {
        title: 'Updated Title',
        status: 'in_progress',
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
      expect(data.status).toBe('in_progress');
    });
  });

  describe('Reschedule with Conflict Checking', () => {
    it('should update lesson time without conflicts', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();
      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      const { request, params } = createPatchRequest(lesson.id, {
        startAt: new Date('2026-02-01T14:00:00Z').toISOString(),
        endAt: new Date('2026-02-01T15:00:00Z').toISOString(),
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.startAt).toBe(new Date('2026-02-01T14:00:00Z').toISOString());
      expect(data.endAt).toBe(new Date('2026-02-01T15:00:00Z').toISOString());
    });

    it('should detect teacher conflict when rescheduling', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create lesson 1 at 10:00-11:00
      const lesson1 = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id }
      );

      // Create lesson 2 at 14:00-15:00
      const lesson2 = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T14:00:00Z'),
        new Date('2026-02-01T15:00:00Z'),
        { studentId: student2.id }
      );

      // Try to reschedule lesson2 to overlap with lesson1 (10:30-11:30)
      const { request, params } = createPatchRequest(lesson2.id, {
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.conflicts.teacher).toHaveLength(1);
      expect(data.conflicts.teacher[0].id).toBe(lesson1.id);
    });

    it('should detect room conflict when rescheduling', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const room = await createTestRoom();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create lesson 1 with room at 10:00-11:00
      const lesson1 = await createTestLesson(
        teacher1.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id, roomId: room.id }
      );

      // Create lesson 2 with same room at 14:00-15:00
      const lesson2 = await createTestLesson(
        teacher2.id,
        new Date('2026-02-01T14:00:00Z'),
        new Date('2026-02-01T15:00:00Z'),
        { studentId: student2.id, roomId: room.id }
      );

      // Try to reschedule lesson2 to overlap with lesson1
      const { request, params } = createPatchRequest(lesson2.id, {
        startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.conflicts.room).toHaveLength(1);
      expect(data.conflicts.room[0].id).toBe(lesson1.id);
    });

    it('should not detect self-conflict when only updating time', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      // Create lesson at 10:00-11:00
      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      // Reschedule same lesson to 10:15-11:15 (should not conflict with itself)
      const { request, params } = createPatchRequest(lesson.id, {
        startAt: new Date('2026-02-01T10:15:00Z').toISOString(),
        endAt: new Date('2026-02-01T11:15:00Z').toISOString(),
      });

      const response = await PATCH(request, params);

      expect(response.status).toBe(200);
    });

    it('should allow rescheduling when not changing time or resources', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, title: 'Old Title' }
      );

      // Only update title - no conflict check needed
      const { request, params } = createPatchRequest(lesson.id, {
        title: 'New Title',
      });

      const response = await PATCH(request, params);

      expect(response.status).toBe(200);
    });
  });

  describe('Teacher Change with Conflict Checking', () => {
    it('should detect conflict when changing teacher to one who is busy', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Teacher2 has a lesson at 10:00-11:00
      await createTestLesson(
        teacher2.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id }
      );

      // Teacher1 has a lesson at 10:30-11:30
      const lesson = await createTestLesson(
        teacher1.id,
        new Date('2026-02-01T10:30:00Z'),
        new Date('2026-02-01T11:30:00Z'),
        { studentId: student2.id }
      );

      // Try to change teacher from teacher1 to teacher2 (who is busy)
      const { request, params } = createPatchRequest(lesson.id, {
        teacherId: teacher2.id,
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.conflicts.teacher).toHaveLength(1);
    });

    it('should allow changing teacher to one who is available', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const student = await createTestStudent();

      // Teacher1 has a lesson at 10:00-11:00
      const lesson = await createTestLesson(
        teacher1.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      // Teacher2 is available, so change should succeed
      const { request, params } = createPatchRequest(lesson.id, {
        teacherId: teacher2.id,
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.teacherId).toBe(teacher2.id);
    });
  });

  describe('Room Change with Conflict Checking', () => {
    it('should detect conflict when changing to a busy room', async () => {
      const teacher1 = await createTestTeacher();
      const teacher2 = await createTestTeacher();
      const room1 = await createTestRoom();
      const room2 = await createTestRoom();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Room2 is booked at 10:00-11:00
      await createTestLesson(
        teacher1.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id, roomId: room2.id }
      );

      // Lesson in room1 at 10:30-11:30
      const lesson = await createTestLesson(
        teacher2.id,
        new Date('2026-02-01T10:30:00Z'),
        new Date('2026-02-01T11:30:00Z'),
        { studentId: student2.id, roomId: room1.id }
      );

      // Try to change room to room2 (which is busy)
      const { request, params } = createPatchRequest(lesson.id, {
        roomId: room2.id,
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.conflicts.room).toHaveLength(1);
    });

    it('should allow changing to an available room', async () => {
      const teacher = await createTestTeacher();
      const room1 = await createTestRoom();
      const room2 = await createTestRoom();
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, roomId: room1.id }
      );

      // Change to available room
      const { request, params } = createPatchRequest(lesson.id, {
        roomId: room2.id,
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roomId).toBe(room2.id);
    });

    it('should allow removing room assignment', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom();
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id, roomId: room.id }
      );

      // Remove room (set to null)
      const { request, params } = createPatchRequest(lesson.id, {
        roomId: null,
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roomId).toBeNull();
    });
  });

  describe('Force Update Override', () => {
    it('should update with conflicts when x-force-update is true', async () => {
      const teacher = await createTestTeacher();
      const student1 = await createTestStudent();
      const student2 = await createTestStudent();

      // Create conflicting lesson
      await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student1.id }
      );

      // Create lesson to reschedule
      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T14:00:00Z'),
        new Date('2026-02-01T15:00:00Z'),
        { studentId: student2.id }
      );

      // Reschedule with conflict, but force it
      const { request, params } = createPatchRequest(
        lesson.id,
        {
          startAt: new Date('2026-02-01T10:30:00Z').toISOString(),
          endAt: new Date('2026-02-01T11:30:00Z').toISOString(),
        },
        { 'x-force-update': 'true' }
      );

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.startAt).toBe(new Date('2026-02-01T10:30:00Z').toISOString());
    });
  });

  describe('Validation', () => {
    it('should return 404 for non-existent lesson', async () => {
      const { request, params } = createPatchRequest('nonexistent-id', {
        title: 'New Title',
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should reject update with invalid teacher', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      const { request, params } = createPatchRequest(lesson.id, {
        teacherId: 'nonexistent-teacher',
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_TEACHER');
    });

    it('should reject update with invalid room', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      const { request, params } = createPatchRequest(lesson.id, {
        roomId: 'nonexistent-room',
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ROOM');
    });

    it('should reject update with room in maintenance', async () => {
      const teacher = await createTestTeacher();
      const room = await createTestRoom({ status: 'maintenance' });
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      const { request, params } = createPatchRequest(lesson.id, {
        roomId: room.id,
      });

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('ROOM_UNAVAILABLE');
    });
  });

  describe('Authorization', () => {
    it('should prevent updating lesson from another org', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      const { request, params } = createPatchRequest(
        lesson.id,
        { title: 'Hacked' },
        { 'x-org-id': 'different-org' }
      );

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should require teacher role or higher', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestStudent();

      const lesson = await createTestLesson(
        teacher.id,
        new Date('2026-02-01T10:00:00Z'),
        new Date('2026-02-01T11:00:00Z'),
        { studentId: student.id }
      );

      const { request, params } = createPatchRequest(
        lesson.id,
        { title: 'Update' },
        { 'x-user-role': 'staff' }
      );

      const response = await PATCH(request, params);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });
});

// ============================================
// TEST SUITE: DELETE /api/lessons/:id
// ============================================

describe('DELETE /api/lessons/:id', () => {
  it('should cancel lesson (soft delete)', async () => {
    const teacher = await createTestTeacher();
    const student = await createTestStudent();

    const lesson = await createTestLesson(
      teacher.id,
      new Date('2026-02-01T10:00:00Z'),
      new Date('2026-02-01T11:00:00Z'),
      { studentId: student.id, status: 'upcoming' }
    );

    const { request, params } = createDeleteRequest(lesson.id);
    const response = await DELETE(request, params);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lesson.status).toBe('cancelled');
    expect(data.lesson.id).toBe(lesson.id);
  });

  it('should return 404 for non-existent lesson', async () => {
    const { request, params } = createDeleteRequest('nonexistent-id');
    const response = await DELETE(request, params);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should prevent deleting lesson from another org', async () => {
    const teacher = await createTestTeacher();
    const student = await createTestStudent();

    const lesson = await createTestLesson(
      teacher.id,
      new Date('2026-02-01T10:00:00Z'),
      new Date('2026-02-01T11:00:00Z'),
      { studentId: student.id }
    );

    const { request, params } = createDeleteRequest(lesson.id, { 'x-org-id': 'different-org' });
    const response = await DELETE(request, params);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should require teacher role or higher', async () => {
    const teacher = await createTestTeacher();
    const student = await createTestStudent();

    const lesson = await createTestLesson(
      teacher.id,
      new Date('2026-02-01T10:00:00Z'),
      new Date('2026-02-01T11:00:00Z'),
      { studentId: student.id }
    );

    const { request, params } = createDeleteRequest(lesson.id, { 'x-user-role': 'staff' });
    const response = await DELETE(request, params);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

// ============================================
// TEST SUITE: GET /api/lessons/:id
// ============================================

describe('GET /api/lessons/:id', () => {
  it('should get lesson with enriched data', async () => {
    const teacher = await createTestTeacher({ fullName: 'John Doe' });
    const room = await createTestRoom({ name: 'Room A' });
    const student = await createTestStudent({ fullName: 'Jane Smith' });

    const lesson = await createTestLesson(
      teacher.id,
      new Date('2026-02-01T10:00:00Z'),
      new Date('2026-02-01T11:00:00Z'),
      {
        studentId: student.id,
        roomId: room.id,
        title: 'Test Lesson',
        type: 'one_on_one',
      }
    );

    const { request, params } = createGetRequestForId(lesson.id);
    const response = await GET(request, params);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(lesson.id);
    expect(data.title).toBe('Test Lesson');
    expect(data.teacher.fullName).toBe('John Doe');
    expect(data.room.name).toBe('Room A');
    expect(data.student.fullName).toBe('Jane Smith');
  });

  it('should return 404 for non-existent lesson', async () => {
    const { request, params } = createGetRequestForId('nonexistent-id');
    const response = await GET(request, params);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should require staff role or higher', async () => {
    const teacher = await createTestTeacher();
    const student = await createTestStudent();

    const lesson = await createTestLesson(
      teacher.id,
      new Date('2026-02-01T10:00:00Z'),
      new Date('2026-02-01T11:00:00Z'),
      { studentId: student.id }
    );

    const { request, params } = createGetRequestForId(lesson.id, { 'x-user-role': 'unauthorized' });
    const response = await GET(request, params);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });
});
