// ============================================
// TESTS: GET, PATCH, DELETE /api/students/[id]
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../[id]/route';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createTestHeaders, cleanDatabase, createTestGroup, createTestTeacher } from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

// ============================================
// HELPERS
// ============================================

async function createTestStudent(overrides: any = {}) {
  const defaultData = {
    fullName: 'Test Student',
    email: `student_${uuidv4()}@test.com`,
    status: 'active',
    balance: 0,
    plan: 'Monthly Basic',
    groupIds: [],
  };

  const request = new NextRequest('http://localhost:3000/api/students', {
    method: 'POST',
    headers: createTestHeaders(),
    body: JSON.stringify({ ...defaultData, ...overrides }),
  });

  const response = await POST(request);
  return await response.json();
}

function createGetRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/students/${id}`, {
    method: 'GET',
    headers: createTestHeaders(headers),
  });
}

function createPatchRequest(
  id: string,
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000/api/students/${id}`, {
    method: 'PATCH',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/students/${id}`, {
    method: 'DELETE',
    headers: createTestHeaders(headers),
  });
}

async function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ============================================
// TEST SUITE: GET /api/students/[id]
// ============================================

describe('GET /api/students/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should allow staff role', async () => {
      const student = await createTestStudent();
      const request = createGetRequest(student.id, { 'x-user-role': 'staff' });
      const response = await GET(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });

    it('should allow manager role', async () => {
      const student = await createTestStudent();
      const request = createGetRequest(student.id, { 'x-user-role': 'manager' });
      const response = await GET(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });

    it('should allow admin role', async () => {
      const student = await createTestStudent();
      const request = createGetRequest(student.id, { 'x-user-role': 'admin' });
      const response = await GET(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Retrieval', () => {
    it('should get student by ID successfully', async () => {
      const student = await createTestStudent({
        fullName: 'Ahmed Hassan',
        email: 'ahmed@student.com',
        phone: '+1234567890',
        status: 'active',
        balance: 250,
        plan: 'Annual Premium',
      });

      const request = createGetRequest(student.id);
      const response = await GET(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(student.id);
      expect(data.fullName).toBe('Ahmed Hassan');
      expect(data.email).toBe('ahmed@student.com');
      expect(data.phone).toBe('+1234567890');
      expect(data.status).toBe('active');
      expect(data.balance).toBe(250);
      expect(data.plan).toBe('Annual Premium');
    });

    it('should return 404 for non-existent student', async () => {
      const request = createGetRequest('non-existent-id');
      const response = await GET(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });

    it('should include all student fields', async () => {
      const student = await createTestStudent({
        groupIds: [],
      });

      const request = createGetRequest(student.id);
      const response = await GET(request, await mockParams(student.id));
      const data = await response.json();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('fullName');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('groupIds');
      expect(data).toHaveProperty('attendancePercent');
      expect(data).toHaveProperty('balance');
      expect(data).toHaveProperty('plan');
      expect(data).toHaveProperty('orgId');
    });

    it('should include groupIds array', async () => {
      const teacher = await createTestTeacher();
      const group = await createTestGroup(teacher.id);
      const student = await createTestStudent({
        groupIds: [group.id],
      });

      const request = createGetRequest(student.id);
      const response = await GET(request, await mockParams(student.id));
      const data = await response.json();

      expect(data.groupIds).toEqual([group.id]);
    });
  });
});

// ============================================
// TEST SUITE: PATCH /api/students/[id]
// ============================================

describe('PATCH /api/students/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should allow staff role', async () => {
      const student = await createTestStudent();
      const request = createPatchRequest(
        student.id,
        { fullName: 'Updated' },
        { 'x-user-role': 'staff' }
      );
      const response = await PATCH(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });

    it('should allow manager role', async () => {
      const student = await createTestStudent();
      const request = createPatchRequest(
        student.id,
        { fullName: 'Updated Name' },
        { 'x-user-role': 'manager' }
      );
      const response = await PATCH(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });

    it('should allow admin role', async () => {
      const student = await createTestStudent();
      const request = createPatchRequest(
        student.id,
        { fullName: 'Updated Name' },
        { 'x-user-role': 'admin' }
      );
      const response = await PATCH(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Updates', () => {
    it('should update student name', async () => {
      const student = await createTestStudent({ fullName: 'Original Name' });

      const request = createPatchRequest(student.id, { fullName: 'Updated Name' });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fullName).toBe('Updated Name');
    });

    it('should update email', async () => {
      const student = await createTestStudent({ email: 'old@test.com' });

      const request = createPatchRequest(student.id, { email: 'new@test.com' });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe('new@test.com');
    });

    it('should update phone', async () => {
      const student = await createTestStudent({ phone: '+1111111111' });

      const request = createPatchRequest(student.id, { phone: '+2222222222' });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phone).toBe('+2222222222');
    });

    it('should update status', async () => {
      const student = await createTestStudent({ status: 'active' });

      const request = createPatchRequest(student.id, { status: 'at_risk' });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('at_risk');
    });

    it('should update balance', async () => {
      const student = await createTestStudent({ balance: 0 });

      const request = createPatchRequest(student.id, { balance: 500 });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.balance).toBe(500);
    });

    it('should update plan', async () => {
      const student = await createTestStudent({ plan: 'Monthly Basic' });

      const request = createPatchRequest(student.id, { plan: 'Annual Premium' });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.plan).toBe('Annual Premium');
    });

    it('should update groupIds', async () => {
      const teacher = await createTestTeacher();
      const group1 = await createTestGroup(teacher.id, { name: 'Math' });
      const group2 = await createTestGroup(teacher.id, { name: 'Science' });

      const student = await createTestStudent({ groupIds: [group1.id] });

      const request = createPatchRequest(student.id, { groupIds: [group1.id, group2.id] });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.groupIds).toEqual([group1.id, group2.id]);
    });

    it('should update multiple fields at once', async () => {
      const student = await createTestStudent();

      const request = createPatchRequest(student.id, {
        fullName: 'New Name',
        status: 'at_risk',
        balance: 150,
        plan: 'Custom Plan',
      });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fullName).toBe('New Name');
      expect(data.status).toBe('at_risk');
      expect(data.balance).toBe(150);
      expect(data.plan).toBe('Custom Plan');
    });

    it('should return 404 for non-existent student', async () => {
      const request = createPatchRequest('non-existent-id', { fullName: 'Updated' });
      const response = await PATCH(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });

    it('should clear groupIds with empty array', async () => {
      const teacher = await createTestTeacher();
      const group = await createTestGroup(teacher.id);
      const student = await createTestStudent({ groupIds: [group.id] });

      const request = createPatchRequest(student.id, { groupIds: [] });
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.groupIds).toEqual([]);
    });
  });

  describe('Org Isolation', () => {
    it('should prevent updating student from different organization', async () => {
      const student = await createTestStudent();

      const request = createPatchRequest(
        student.id,
        { fullName: 'Hacker Update' },
        { 'x-org-id': 'different-org-id' }
      );
      const response = await PATCH(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('Duplicate Email', () => {
    it('should reject email that already exists for another student', async () => {
      const student1 = await createTestStudent({ email: 'student1@test.com' });
      const student2 = await createTestStudent({ email: 'student2@test.com' });

      // Try to update student2's email to student1's email
      const request = createPatchRequest(student2.id, { email: 'student1@test.com' });
      const response = await PATCH(request, await mockParams(student2.id));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error?.code).toBe('DUPLICATE_EMAIL');
    });

    it('should allow keeping the same email (no change)', async () => {
      const student = await createTestStudent({ email: 'same@test.com' });

      const request = createPatchRequest(student.id, {
        email: 'same@test.com',
        fullName: 'Updated Name',
      });
      const response = await PATCH(request, await mockParams(student.id));

      expect(response.status).toBe(200);
    });
  });

  describe('Validation', () => {
    it('should reject invalid email format', async () => {
      const student = await createTestStudent();

      const request = createPatchRequest(student.id, { email: 'not-an-email' });
      const response = await PATCH(request, await mockParams(student.id));

      expect(response.status).toBe(400);
    });

    it('should reject invalid status', async () => {
      const student = await createTestStudent();

      const request = createPatchRequest(student.id, { status: 'invalid-status' });
      const response = await PATCH(request, await mockParams(student.id));

      expect(response.status).toBe(400);
    });

    it('should reject fullName that is too short', async () => {
      const student = await createTestStudent();

      const request = createPatchRequest(student.id, { fullName: 'A' });
      const response = await PATCH(request, await mockParams(student.id));

      expect(response.status).toBe(400);
    });

    it('should reject fullName that is too long', async () => {
      const student = await createTestStudent();

      const request = createPatchRequest(student.id, { fullName: 'A'.repeat(101) });
      const response = await PATCH(request, await mockParams(student.id));

      expect(response.status).toBe(400);
    });
  });
});

// ============================================
// TEST SUITE: DELETE /api/students/[id]
// ============================================

describe('DELETE /api/students/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const student = await createTestStudent();
      const request = createDeleteRequest(student.id, { 'x-user-role': 'staff' });
      const response = await DELETE(request, await mockParams(student.id));
      expect(response.status).toBe(403);
    });

    it('should allow manager role', async () => {
      const student = await createTestStudent();
      const request = createDeleteRequest(student.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });

    it('should allow admin role', async () => {
      const student = await createTestStudent();
      const request = createDeleteRequest(student.id, { 'x-user-role': 'admin' });
      const response = await DELETE(request, await mockParams(student.id));
      expect(response.status).toBe(200);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete by setting status to inactive', async () => {
      const student = await createTestStudent({ status: 'active' });

      const request = createDeleteRequest(student.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.student.status).toBe('inactive');
      expect(data.student.id).toBe(student.id);
    });

    it('should preserve student data when soft deleting', async () => {
      const student = await createTestStudent({
        fullName: 'To Delete',
        email: 'delete@test.com',
        balance: 500,
        plan: 'Premium',
      });

      const request = createDeleteRequest(student.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(student.id));
      const data = await response.json();

      expect(data.student.fullName).toBe('To Delete');
      expect(data.student.email).toBe('delete@test.com');
      expect(data.student.balance).toBe(500);
      expect(data.student.plan).toBe('Premium');
    });

    it('should preserve groupIds when soft deleting', async () => {
      const teacher = await createTestTeacher();
      const group = await createTestGroup(teacher.id);
      const student = await createTestStudent({ groupIds: [group.id] });

      const request = createDeleteRequest(student.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(student.id));
      const data = await response.json();

      expect(data.student.groupIds).toEqual([group.id]);
    });

    it('should return 404 for non-existent student', async () => {
      const request = createDeleteRequest('non-existent-id', { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams('non-existent-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error?.code).toBe('NOT_FOUND');
    });

    it('should allow deleting already inactive student', async () => {
      const student = await createTestStudent({ status: 'inactive' });

      const request = createDeleteRequest(student.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.student.status).toBe('inactive');
    });

    it('should allow deleting at_risk student', async () => {
      const student = await createTestStudent({ status: 'at_risk' });

      const request = createDeleteRequest(student.id, { 'x-user-role': 'manager' });
      const response = await DELETE(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.student.status).toBe('inactive');
    });
  });

  describe('Org Isolation', () => {
    it('should prevent deleting student from different organization', async () => {
      const student = await createTestStudent();

      const request = createDeleteRequest(student.id, {
        'x-user-role': 'manager',
        'x-org-id': 'different-org-id',
      });
      const response = await DELETE(request, await mockParams(student.id));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error?.code).toBe('FORBIDDEN');
    });
  });
});
