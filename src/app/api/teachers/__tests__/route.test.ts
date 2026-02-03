// ============================================
// TESTS: GET & POST /api/teachers
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createTestHeaders, cleanDatabase } from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

// ============================================
// HELPERS
// ============================================

function createGetRequest(
  searchParams: Record<string, string> = {},
  headers: Record<string, string> = {}
): NextRequest {
  const url = new URL('http://localhost:3000/api/teachers');
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
  return new NextRequest('http://localhost:3000/api/teachers', {
    method: 'POST',
    headers: createTestHeaders(headers),
    body: JSON.stringify(body),
  });
}

// ============================================
// TEST SUITE: GET /api/teachers
// ============================================

describe('GET /api/teachers', () => {
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
    it('should return empty array when no teachers exist', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return all teachers for organization', async () => {
      // Create teachers via POST
      await POST(createPostRequest({
        fullName: 'Ahmed Hassan',
        email: 'ahmed@test.com',
        subjects: ['Arabic'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' }));

      await POST(createPostRequest({
        fullName: 'Fatima Ali',
        email: 'fatima@test.com',
        subjects: ['Quran'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 20,
      }, { 'x-user-role': 'manager' }));

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should include lessonsToday count', async () => {
      const createResp = await POST(createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' }));

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0]).toHaveProperty('lessonsToday');
      expect(typeof data.data[0].lessonsToday).toBe('number');
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create 15 teachers
      for (let i = 1; i <= 15; i++) {
        await POST(createPostRequest({
          fullName: `Teacher ${i}`,
          email: `teacher${i}@test.com`,
          subjects: ['Math'],
          status: 'active',
          weeklyAvailability: [],
          maxHours: 25,
        }, { 'x-user-role': 'manager' }));
      }
    });

    it('should paginate results with default limit', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(15); // All 15 teachers (under default limit of 20)
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
        fullName: 'Active Teacher',
        email: 'active@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' }));

      await POST(createPostRequest({
        fullName: 'Inactive Teacher',
        email: 'inactive@test.com',
        subjects: ['Science'],
        status: 'inactive',
        weeklyAvailability: [],
        maxHours: 20,
      }, { 'x-user-role': 'manager' }));
    });

    it('should filter by status=active', async () => {
      const request = createGetRequest({ status: 'active' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('active');
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

      expect(data.data).toHaveLength(2);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await POST(createPostRequest({
        fullName: 'Ahmed Hassan',
        email: 'ahmed.hassan@school.com',
        subjects: ['Arabic', 'Islamic Studies'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' }));

      await POST(createPostRequest({
        fullName: 'Sarah Johnson',
        email: 'sarah.j@school.com',
        subjects: ['English', 'Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 30,
      }, { 'x-user-role': 'manager' }));
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
});

// ============================================
// TEST SUITE: POST /api/teachers
// ============================================

describe('POST /api/teachers', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('should reject staff role', async () => {
      const request = createPostRequest({
        fullName: 'Test',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'staff' });
      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should allow manager role', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should allow admin role', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'admin-test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'admin' });
      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Creation', () => {
    it('should create a teacher successfully', async () => {
      const teacherData = {
        fullName: 'Ahmed Hassan',
        email: 'ahmed@test.com',
        phone: '+1234567890',
        subjects: ['Arabic', 'Islamic Studies'],
        status: 'active',
        weeklyAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        ],
        maxHours: 30,
      };

      const request = createPostRequest(teacherData, { 'x-user-role': 'manager' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.fullName).toBe(teacherData.fullName);
      expect(data.email).toBe(teacherData.email);
      expect(data.subjects).toEqual(teacherData.subjects);
      expect(data.status).toBe(teacherData.status);
      expect(data.maxHours).toBe(teacherData.maxHours);
      expect(data.orgId).toBe(DEFAULT_ORG_ID);
      expect(data.id).toBeDefined();
      expect(data.lessonsToday).toBe(0);
    });

    it('should create teacher without phone (optional field)', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.phone).toBeNull();
    });

    it('should initialize hoursThisWeek to 0', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(data.hoursThisWeek).toBe(0);
    });
  });

  describe('Validation', () => {
    it('should reject missing fullName', async () => {
      const request = createPostRequest({
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject missing email', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'not-an-email',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject empty subjects array', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: [],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid status', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'invalid-status',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject negative maxHours', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: -5,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Duplicate Email', () => {
    it('should reject duplicate email in same organization', async () => {
      // Create first teacher
      await POST(createPostRequest({
        fullName: 'First Teacher',
        email: 'duplicate@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' }));

      // Try to create second teacher with same email
      const request = createPostRequest({
        fullName: 'Second Teacher',
        email: 'duplicate@test.com',
        subjects: ['Science'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 20,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error?.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('Availability Fields', () => {
    it('should accept weekly availability', async () => {
      const weeklyAvailability = [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '17:00' },
      ];

      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability,
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.weeklyAvailability).toEqual(weeklyAvailability);
    });

    it('should accept empty weekly availability array', async () => {
      const request = createPostRequest({
        fullName: 'Test Teacher',
        email: 'test@test.com',
        subjects: ['Math'],
        status: 'active',
        weeklyAvailability: [],
        maxHours: 25,
      }, { 'x-user-role': 'manager' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.weeklyAvailability).toEqual([]);
    });
  });
});
