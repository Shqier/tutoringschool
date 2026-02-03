// ============================================
// TESTS: GET, PATCH, DELETE /api/teachers/[id]
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../[id]/route';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createTestHeaders, cleanDatabase } from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

// ============================================
// HELPERS
// ============================================

async function createTestTeacher(overrides: any = {}) {
  const defaultData = {
    fullName: 'Test Teacher',
    email: `teacher_${uuidv4()}@test.com`,
    subjects: ['Math'],
    status: 'active',
    weeklyAvailability: [],
    maxHours: 25,
  };

  const request = new NextRequest('http://localhost:3000/api/teachers', {
    method: 'POST',
    headers: createTestHeaders({ 'x-user-role': 'manager' }),
    body: JSON.stringify({ ...defaultData, ...overrides }),
  });

  const response = await POST(request);
  return await response.json();
}

function createGetRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/teachers/${id}`, {
    method: 'GET',
    headers: createTestHeaders(headers),
  });
}

function createPatchRequest(
  id: string,
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000/api/teachers/${id}`, {
    method: 'PATCH',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/teachers/${id}`, {
    method: 'DELETE',
    headers: createTestHeaders(headers),
  });
}

async function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ============================================
// TEST SUITE: GET /api/teachers/[id]
// ============================================

describe('GET /api/teachers/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should allow staff role', async () => {
      const teacher = await createTestTeacher();
      const request = createGetRequest(teacher.id, { 'x-user-role': 'staff' });
      const response = await GET(request, await mockParams(teacher.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Retrieval', () => {
    it('should get teacher by ID successfully', async () => {
      const teacher = await createTestTeacher({
        fullName: 'Ahmed Hassan',
        email: 'ahmed@test.com',
        phone: '+1234567890',
        subjects: ['Arabic', 'Quran'],
        maxHours: 30,
      });

      const request = createGetRequest(teacher.id);
      const response = await GET(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(teacher.id);
      expect(data.fullName).toBe('Ahmed Hassan');
      expect(data.email).toBe('ahmed@test.com');
      expect(data.subjects).toEqual(['Arabic', 'Quran']);
      expect(data.maxHours).toBe(30);
      expect(data).toHaveProperty('lessonsToday');
    });

    it('should return 404 for non-existent teacher', async () => {
      const request = createGetRequest('non-existent-id');
      const response = await GET(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });

    it('should include availability fields', async () => {
      const teacher = await createTestTeacher({
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
      });

      const request = createGetRequest(teacher.id);
      const response = await GET(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(data.weeklyAvailability).toBeDefined();
      expect(data.availabilityExceptions).toBeDefined();
    });
  });
});

// ============================================
// TEST SUITE: PATCH /api/teachers/[id]
// ============================================

describe('PATCH /api/teachers/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const teacher = await createTestTeacher();
      const request = createPatchRequest(
        teacher.id,
        { fullName: 'Updated' },
        { 'x-user-role': 'staff' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      expect(response.status).toBe(403);
    });

    it('should allow manager role', async () => {
      const teacher = await createTestTeacher();
      const request = createPatchRequest(
        teacher.id,
        { fullName: 'Updated Name' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      expect(response.status).toBe(200);
    });

    it('should allow admin role', async () => {
      const teacher = await createTestTeacher();
      const request = createPatchRequest(
        teacher.id,
        { fullName: 'Updated Name' },
        { 'x-user-role': 'admin' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Updates', () => {
    it('should update teacher name', async () => {
      const teacher = await createTestTeacher({ fullName: 'Original Name' });

      const request = createPatchRequest(
        teacher.id,
        { fullName: 'Updated Name' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fullName).toBe('Updated Name');
    });

    it('should update email', async () => {
      const teacher = await createTestTeacher({ email: 'old@test.com' });

      const request = createPatchRequest(
        teacher.id,
        { email: 'new@test.com' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('new@test.com');
    });

    it('should update subjects', async () => {
      const teacher = await createTestTeacher({ subjects: ['Math'] });

      const request = createPatchRequest(
        teacher.id,
        { subjects: ['Arabic', 'Islamic Studies'] },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subjects).toEqual(['Arabic', 'Islamic Studies']);
    });

    it('should update status', async () => {
      const teacher = await createTestTeacher({ status: 'active' });

      const request = createPatchRequest(
        teacher.id,
        { status: 'inactive' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('inactive');
    });

    it('should update maxHours', async () => {
      const teacher = await createTestTeacher({ maxHours: 25 });

      const request = createPatchRequest(
        teacher.id,
        { maxHours: 30 },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.maxHours).toBe(30);
    });

    it('should update multiple fields at once', async () => {
      const teacher = await createTestTeacher();

      const request = createPatchRequest(
        teacher.id,
        {
          fullName: 'New Name',
          subjects: ['Science', 'Math'],
          maxHours: 35,
        },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fullName).toBe('New Name');
      expect(data.subjects).toEqual(['Science', 'Math']);
      expect(data.maxHours).toBe(35);
    });

    it('should return 404 for non-existent teacher', async () => {
      const request = createPatchRequest(
        'non-existent-id',
        { fullName: 'Updated' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Availability Updates', () => {
    it('should update weekly availability', async () => {
      const teacher = await createTestTeacher({
        weeklyAvailability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
      });

      const newAvailability = [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
      ];

      const request = createPatchRequest(
        teacher.id,
        { weeklyAvailability: newAvailability },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeklyAvailability).toEqual(newAvailability);
    });

    it('should update availability exceptions', async () => {
      const teacher = await createTestTeacher();

      const exceptions = [
        {
          id: uuidv4(),
          type: 'unavailable',
          startDate: '2026-02-10',
          endDate: '2026-02-14',
          reason: 'Vacation',
          allDay: true,
        },
      ];

      const request = createPatchRequest(
        teacher.id,
        { availabilityExceptions: exceptions },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.availabilityExceptions).toEqual(exceptions);
    });

    it('should clear weekly availability with empty array', async () => {
      const teacher = await createTestTeacher({
        weeklyAvailability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
      });

      const request = createPatchRequest(
        teacher.id,
        { weeklyAvailability: [] },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weeklyAvailability).toEqual([]);
    });
  });

  describe('Duplicate Email', () => {
    it('should reject email that already exists for another teacher', async () => {
      const teacher1 = await createTestTeacher({ email: 'teacher1@test.com' });
      const teacher2 = await createTestTeacher({ email: 'teacher2@test.com' });

      // Try to update teacher2's email to teacher1's email
      const request = createPatchRequest(
        teacher2.id,
        { email: 'teacher1@test.com' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher2.id));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error?.code).toBe('DUPLICATE_EMAIL');
    });

    it('should allow keeping the same email (no change)', async () => {
      const teacher = await createTestTeacher({ email: 'same@test.com' });

      const request = createPatchRequest(
        teacher.id,
        { email: 'same@test.com', fullName: 'Updated Name' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));

      expect(response.status).toBe(200);
    });
  });

  describe('Validation', () => {
    it('should reject invalid email format', async () => {
      const teacher = await createTestTeacher();

      const request = createPatchRequest(
        teacher.id,
        { email: 'not-an-email' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));

      expect(response.status).toBe(400);
    });

    it('should reject empty subjects array', async () => {
      const teacher = await createTestTeacher();

      const request = createPatchRequest(
        teacher.id,
        { subjects: [] },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));

      expect(response.status).toBe(400);
    });

    it('should reject negative maxHours', async () => {
      const teacher = await createTestTeacher();

      const request = createPatchRequest(
        teacher.id,
        { maxHours: -10 },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(teacher.id));

      expect(response.status).toBe(400);
    });
  });
});

// ============================================
// TEST SUITE: DELETE /api/teachers/[id]
// ============================================

describe('DELETE /api/teachers/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const teacher = await createTestTeacher();
      const request = createDeleteRequest(teacher.id, { 'x-user-role': 'staff' });
      const response = await DELETE(request, await mockParams(teacher.id));
      expect(response.status).toBe(403);
    });

    it('should reject manager role', async () => {
      const teacher = await createTestTeacher();
      const request = createDeleteRequest(teacher.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(teacher.id));
      expect(response.status).toBe(403);
    });

    it('should allow admin role', async () => {
      const teacher = await createTestTeacher();
      const request = createDeleteRequest(teacher.id, { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams(teacher.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete by setting status to inactive', async () => {
      const teacher = await createTestTeacher({ status: 'active' });

      const request = createDeleteRequest(teacher.id, { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.teacher.status).toBe('inactive');
      expect(data.teacher.id).toBe(teacher.id);
    });

    it('should preserve teacher data when soft deleting', async () => {
      const teacher = await createTestTeacher({
        fullName: 'To Delete',
        email: 'delete@test.com',
        subjects: ['Math', 'Science'],
      });

      const request = createDeleteRequest(teacher.id, { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(data.teacher.fullName).toBe('To Delete');
      expect(data.teacher.email).toBe('delete@test.com');
      expect(data.teacher.subjects).toEqual(['Math', 'Science']);
    });

    it('should return 404 for non-existent teacher', async () => {
      const request = createDeleteRequest('non-existent-id', { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });

    it('should allow deleting already inactive teacher', async () => {
      const teacher = await createTestTeacher({ status: 'inactive' });

      const request = createDeleteRequest(teacher.id, { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams(teacher.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.teacher.status).toBe('inactive');
    });
  });
});
