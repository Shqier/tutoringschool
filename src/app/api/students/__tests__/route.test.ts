// ============================================
// TESTS: GET & POST /api/students
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createTestHeaders, cleanDatabase, createTestGroup, createTestTeacher } from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

// ============================================
// HELPERS
// ============================================

function createGetRequest(
  searchParams: Record<string, string> = {},
  headers: Record<string, string> = {}
): NextRequest {
  const url = new URL('http://localhost:3000/api/students');
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
  return new NextRequest('http://localhost:3000/api/students', {
    method: 'POST',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

// ============================================
// TEST SUITE: GET /api/students
// ============================================

describe('GET /api/students', () => {
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
    it('should return empty array when no students exist', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return all students for organization', async () => {
      // Create students via POST
      await POST(createPostRequest({
        fullName: 'Ahmed Hassan',
        email: 'ahmed@student.com',
        status: 'active',
        balance: 0,
        plan: 'Monthly Basic',
      }));

      await POST(createPostRequest({
        fullName: 'Fatima Ali',
        email: 'fatima@student.com',
        status: 'active',
        balance: 100,
        plan: 'Annual Premium',
      }));

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should include attendancePercent field', async () => {
      await POST(createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        status: 'active',
      }));

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0]).toHaveProperty('attendancePercent');
      expect(typeof data.data[0].attendancePercent).toBe('number');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create 15 students
      for (let i = 1; i <= 15; i++) {
        await POST(createPostRequest({
          fullName: `Student ${i}`,
          email: `student${i}@test.com`,
          status: 'active',
        }));
      }
    });

    it('should paginate results with default limit', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(15); // All 15 students (under default limit of 20)
      expect(data.pagination.total).toBe(15);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20); // Default limit
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
      await POST(createPostRequest({
        fullName: 'Active Student',
        email: 'active@test.com',
        status: 'active',
      }));

      await POST(createPostRequest({
        fullName: 'At Risk Student',
        email: 'atrisk@test.com',
        status: 'at_risk',
      }));

      await POST(createPostRequest({
        fullName: 'Inactive Student',
        email: 'inactive@test.com',
        status: 'inactive',
      }));
    });

    it('should filter by status=active', async () => {
      const request = createGetRequest({ status: 'active' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('active');
    });

    it('should filter by status=at_risk', async () => {
      const request = createGetRequest({ status: 'at_risk' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('at_risk');
    });

    it('should filter by status=inactive', async () => {
      const request = createGetRequest({ status: 'inactive' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('inactive');
    });

    it('should return all when status=all', async () => {
      const request = createGetRequest({ status: 'all' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(3);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await POST(createPostRequest({
        fullName: 'Ahmed Hassan',
        email: 'ahmed.hassan@school.com',
        status: 'active',
      }));

      await POST(createPostRequest({
        fullName: 'Sarah Johnson',
        email: 'sarah.j@school.com',
        status: 'active',
      }));
    });

    it('should search by name (case insensitive)', async () => {
      const request = createGetRequest({ search: 'ahmed' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].fullName).toBe('Ahmed Hassan');
    });

    it('should search by email', async () => {
      const request = createGetRequest({ search: 'sarah.j' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].email).toBe('sarah.j@school.com');
    });

    it('should search by partial name match', async () => {
      const request = createGetRequest({ search: 'hassan' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].fullName).toBe('Ahmed Hassan');
    });

    it('should return empty array when no matches', async () => {
      const request = createGetRequest({ search: 'nonexistent' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(0);
    });
  });

  describe('Group Filtering', () => {
    it('should filter students by groupId', async () => {
      const teacher = await createTestTeacher();
      const group1 = await createTestGroup(teacher.id, { name: 'Group A' });
      const group2 = await createTestGroup(teacher.id, { name: 'Group B' });

      // Create students in different groups
      await POST(createPostRequest({
        fullName: 'Student in Group A',
        email: 'groupa@test.com',
        groupIds: [group1.id],
      }));

      await POST(createPostRequest({
        fullName: 'Student in Group B',
        email: 'groupb@test.com',
        groupIds: [group2.id],
      }));

      await POST(createPostRequest({
        fullName: 'Student in Both Groups',
        email: 'both@test.com',
        groupIds: [group1.id, group2.id],
      }));

      // Filter by group1
      const request = createGetRequest({ groupId: group1.id });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(data.data.every((s: any) => s.groupIds.includes(group1.id))).toBe(true);
    });

    it('should return empty array when no students in group', async () => {
      const teacher = await createTestTeacher();
      const group = await createTestGroup(teacher.id);

      const request = createGetRequest({ groupId: group.id });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(0);
    });
  });
});

// ============================================
// TEST SUITE: POST /api/students
// ============================================

describe('POST /api/students', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should allow staff role', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        status: 'active',
      }, { 'x-user-role': 'staff' });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should allow manager role', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'manager-test@student.com',
        status: 'active',
      }, { 'x-user-role': 'manager' });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should allow admin role', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'admin-test@student.com',
        status: 'active',
      }, { 'x-user-role': 'admin' });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Creation', () => {
    it('should create a student successfully', async () => {
      const studentData = {
        fullName: 'Ahmed Hassan',
        email: 'ahmed@student.com',
        phone: '+1234567890',
        status: 'active',
        balance: 150,
        plan: 'Annual Premium',
        groupIds: [],
      };

      const request = createPostRequest(studentData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.fullName).toBe(studentData.fullName);
      expect(data.email).toBe(studentData.email);
      expect(data.phone).toBe(studentData.phone);
      expect(data.status).toBe(studentData.status);
      expect(data.balance).toBe(studentData.balance);
      expect(data.plan).toBe(studentData.plan);
      expect(data.orgId).toBe(DEFAULT_ORG_ID);
      expect(data.id).toBeDefined();
      expect(data.attendancePercent).toBe(100);
    });

    it('should create student without phone (optional field)', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        status: 'active',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.phone).toBeNull();
    });

    it('should initialize attendancePercent to 100', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        status: 'active',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.attendancePercent).toBe(100);
    });

    it('should use default values for optional fields', async () => {
      const request = createPostRequest({
        fullName: 'Minimal Student',
        email: 'minimal@student.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('active');
      expect(data.balance).toBe(0);
      expect(data.plan).toBe('Monthly Basic');
      expect(data.groupIds).toEqual([]);
    });

    it('should create student with groupIds', async () => {
      const teacher = await createTestTeacher();
      const group1 = await createTestGroup(teacher.id, { name: 'Math Class' });
      const group2 = await createTestGroup(teacher.id, { name: 'Science Class' });

      const request = createPostRequest({
        fullName: 'Multi-Group Student',
        email: 'multigroup@student.com',
        groupIds: [group1.id, group2.id],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.groupIds).toEqual([group1.id, group2.id]);
    });
  });

  describe('Validation', () => {
    it('should reject missing fullName', async () => {
      const request = createPostRequest({
        email: 'test@student.com',
        status: 'active',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject missing email', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        status: 'active',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'not-an-email',
        status: 'active',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid status', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        status: 'invalid-status',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject fullName that is too short', async () => {
      const request = createPostRequest({
        fullName: 'A',
        email: 'test@student.com',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject fullName that is too long', async () => {
      const request = createPostRequest({
        fullName: 'A'.repeat(101),
        email: 'test@student.com',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Duplicate Email', () => {
    it('should reject duplicate email in same organization', async () => {
      // Create first student
      await POST(createPostRequest({
        fullName: 'First Student',
        email: 'duplicate@student.com',
        status: 'active',
      }));

      // Try to create second student with same email
      const request = createPostRequest({
        fullName: 'Second Student',
        email: 'duplicate@student.com',
        status: 'active',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error?.code).toBe('DUPLICATE_EMAIL');
    });

    it('should provide clear error message for duplicate email', async () => {
      await POST(createPostRequest({
        fullName: 'First Student',
        email: 'test@student.com',
      }));

      const request = createPostRequest({
        fullName: 'Second Student',
        email: 'test@student.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error?.message).toContain('already exists');
    });
  });

  describe('Status Values', () => {
    it('should accept status=active', async () => {
      const request = createPostRequest({
        fullName: 'Active Student',
        email: 'active@test.com',
        status: 'active',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('active');
    });

    it('should accept status=at_risk', async () => {
      const request = createPostRequest({
        fullName: 'At Risk Student',
        email: 'atrisk@test.com',
        status: 'at_risk',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('at_risk');
    });

    it('should accept status=inactive', async () => {
      const request = createPostRequest({
        fullName: 'Inactive Student',
        email: 'inactive@test.com',
        status: 'inactive',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('inactive');
    });
  });

  describe('Balance and Plan', () => {
    it('should accept positive balance', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        balance: 500,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.balance).toBe(500);
    });

    it('should accept negative balance (owed amount)', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        balance: -100,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.balance).toBe(-100);
    });

    it('should accept custom plan', async () => {
      const request = createPostRequest({
        fullName: 'Test Student',
        email: 'test@student.com',
        plan: 'Custom Enterprise Plan',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.plan).toBe('Custom Enterprise Plan');
    });
  });
});
