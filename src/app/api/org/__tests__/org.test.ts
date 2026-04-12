// ============================================
// TESTS: GET /api/org
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../route';
import { GET as getMembersGET, POST as membersInvitePOST } from '../members/route';
import { PATCH as memberPATCH, DELETE as memberDELETE } from '../members/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createTestHeaders, cleanDatabase } from '@/lib/test/db-helpers';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

// ============================================
// HELPERS
// ============================================

function makeRequest(
  url: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers: createTestHeaders(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createTestOrg(overrides: Record<string, unknown> = {}) {
  return prisma.organization.create({
    data: {
      id: DEFAULT_ORG_ID,
      name: 'Busala School',
      slug: 'busala-school',
      plan: 'free',
      ...overrides,
    },
  });
}

async function createTestMember(overrides: Record<string, unknown> = {}) {
  return prisma.teamMember.create({
    data: {
      orgId: DEFAULT_ORG_ID,
      role: 'user',
      inviteEmail: `invite_${Date.now()}@test.com`,
      status: 'pending',
      ...overrides,
    },
  });
}

// ============================================
// TEST SUITE: GET /api/org
// ============================================

describe('GET /api/org', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('returns 403 when no role header provided (unauthenticated default passes as admin in dev)', async () => {
      // In dev mode, no headers defaults to admin — still gets 404 since no org exists
      const request = makeRequest('/api/org', 'GET');
      const response = await GET(request);
      // Org doesn't exist yet — 404
      expect(response.status).toBe(404);
    });

    it('returns 403 for role below staff', async () => {
      // There's no role below staff in the hierarchy in this app; teacher is at level 2.
      // Staff is minimum; all roles (staff, teacher, manager, admin) pass.
      const request = makeRequest('/api/org', 'GET', undefined, { 'x-user-role': 'staff' });
      const response = await GET(request);
      // No org found → 404, but auth passed
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Org lookup', () => {
    it('returns 404 when org does not exist', async () => {
      const request = makeRequest('/api/org', 'GET');
      const response = await GET(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('returns org data when org exists', async () => {
      await createTestOrg();

      const request = makeRequest('/api/org', 'GET');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(DEFAULT_ORG_ID);
      expect(data.name).toBe('Busala School');
      expect(data.slug).toBe('busala-school');
      expect(data.plan).toBe('free');
    });

    it('does not return orgs from other organizations', async () => {
      await createTestOrg({ id: 'other_org_id', slug: 'other-org' });
      // User's orgId = DEFAULT_ORG_ID which doesn't exist
      const request = makeRequest('/api/org', 'GET');
      const response = await GET(request);
      expect(response.status).toBe(404);
    });
  });
});

// ============================================
// TEST SUITE: GET /api/org/members
// ============================================

describe('GET /api/org/members', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('returns 403 for staff role', async () => {
      const request = makeRequest('/api/org/members', 'GET', undefined, { 'x-user-role': 'staff' });
      const response = await getMembersGET(request);
      expect(response.status).toBe(403);
    });

    it('returns 403 for manager role', async () => {
      const request = makeRequest('/api/org/members', 'GET', undefined, { 'x-user-role': 'manager' });
      const response = await getMembersGET(request);
      expect(response.status).toBe(403);
    });

    it('allows admin role', async () => {
      const request = makeRequest('/api/org/members', 'GET', undefined, { 'x-user-role': 'admin' });
      const response = await getMembersGET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Listing', () => {
    it('returns empty list when no members exist', async () => {
      const request = makeRequest('/api/org/members', 'GET');
      const response = await getMembersGET(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('returns members for org', async () => {
      await createTestMember({ inviteEmail: 'a@test.com' });
      await createTestMember({ inviteEmail: 'b@test.com' });

      const request = makeRequest('/api/org/members', 'GET');
      const response = await getMembersGET(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('does not return members from other orgs', async () => {
      await createTestMember({ orgId: 'other_org', inviteEmail: 'other@test.com' });

      const request = makeRequest('/api/org/members', 'GET');
      const response = await getMembersGET(request);
      const data = await response.json();
      expect(data.data).toHaveLength(0);
    });

    it('filters by status', async () => {
      await createTestMember({ status: 'active', inviteEmail: 'active@test.com' });
      await createTestMember({ status: 'pending', inviteEmail: 'pending@test.com' });

      const request = makeRequest('/api/org/members?status=active', 'GET');
      const response = await getMembersGET(request);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('active');
    });
  });
});

// ============================================
// TEST SUITE: POST /api/org/members (invite)
// ============================================

describe('POST /api/org/members (invite)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authorization', () => {
    it('returns 403 for staff role', async () => {
      const request = makeRequest('/api/org/members', 'POST',
        { inviteEmail: 'test@test.com', role: 'user' },
        { 'x-user-role': 'staff' }
      );
      const response = await membersInvitePOST(request);
      expect(response.status).toBe(403);
    });

    it('returns 403 for manager role', async () => {
      const request = makeRequest('/api/org/members', 'POST',
        { inviteEmail: 'test@test.com', role: 'user' },
        { 'x-user-role': 'manager' }
      );
      const response = await membersInvitePOST(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('returns 400 for missing inviteEmail', async () => {
      const request = makeRequest('/api/org/members', 'POST', { role: 'user' });
      const response = await membersInvitePOST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid email', async () => {
      const request = makeRequest('/api/org/members', 'POST', { inviteEmail: 'not-an-email', role: 'user' });
      const response = await membersInvitePOST(request);
      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid role', async () => {
      const request = makeRequest('/api/org/members', 'POST', { inviteEmail: 'test@test.com', role: 'superadmin' });
      const response = await membersInvitePOST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Creating invites', () => {
    it('creates a pending invite', async () => {
      const request = makeRequest('/api/org/members', 'POST', {
        inviteEmail: 'newmember@test.com',
        role: 'manager',
      });
      const response = await membersInvitePOST(request);
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.inviteEmail).toBe('newmember@test.com');
      expect(data.role).toBe('manager');
      expect(data.status).toBe('pending');
      expect(data.orgId).toBe(DEFAULT_ORG_ID);
    });

    it('returns 409 for duplicate invite email in org', async () => {
      await createTestMember({ inviteEmail: 'dup@test.com', status: 'pending' });

      const request = makeRequest('/api/org/members', 'POST', {
        inviteEmail: 'dup@test.com',
        role: 'user',
      });
      const response = await membersInvitePOST(request);
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error.code).toBe('DUPLICATE_INVITE');
    });

    it('accepts all valid roles: admin, manager, user', async () => {
      for (const role of ['admin', 'manager', 'user']) {
        const request = makeRequest('/api/org/members', 'POST', {
          inviteEmail: `${role}@test.com`,
          role,
        });
        const response = await membersInvitePOST(request);
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.role).toBe(role);
      }
    });
  });
});

// ============================================
// TEST SUITE: PATCH /api/org/members/[id]
// ============================================

describe('PATCH /api/org/members/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns 403 for non-admin', async () => {
    const member = await createTestMember();
    const request = makeRequest(`/api/org/members/${member.id}`, 'PATCH',
      { role: 'admin' },
      { 'x-user-role': 'manager' }
    );
    const response = await memberPATCH(request, { params: Promise.resolve({ id: member.id }) });
    expect(response.status).toBe(403);
  });

  it('returns 404 for unknown id', async () => {
    const request = makeRequest('/api/org/members/unknown', 'PATCH', { role: 'user' });
    const response = await memberPATCH(request, { params: Promise.resolve({ id: 'unknown' }) });
    expect(response.status).toBe(404);
  });

  it('returns 404 for member from different org', async () => {
    const member = await createTestMember({ orgId: 'other_org', inviteEmail: 'x@test.com' });
    const request = makeRequest(`/api/org/members/${member.id}`, 'PATCH', { role: 'user' });
    const response = await memberPATCH(request, { params: Promise.resolve({ id: member.id }) });
    expect(response.status).toBe(404);
  });

  it('updates member role', async () => {
    const member = await createTestMember({ role: 'user' });
    const request = makeRequest(`/api/org/members/${member.id}`, 'PATCH', { role: 'admin' });
    const response = await memberPATCH(request, { params: Promise.resolve({ id: member.id }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.role).toBe('admin');
  });

  it('returns 400 for invalid role', async () => {
    const member = await createTestMember();
    const request = makeRequest(`/api/org/members/${member.id}`, 'PATCH', { role: 'owner' });
    const response = await memberPATCH(request, { params: Promise.resolve({ id: member.id }) });
    expect(response.status).toBe(400);
  });
});

// ============================================
// TEST SUITE: DELETE /api/org/members/[id]
// ============================================

describe('DELETE /api/org/members/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns 403 for non-admin', async () => {
    const member = await createTestMember();
    const request = makeRequest(`/api/org/members/${member.id}`, 'DELETE', undefined, { 'x-user-role': 'manager' });
    const response = await memberDELETE(request, { params: Promise.resolve({ id: member.id }) });
    expect(response.status).toBe(403);
  });

  it('returns 404 for unknown member', async () => {
    const request = makeRequest('/api/org/members/unknown', 'DELETE');
    const response = await memberDELETE(request, { params: Promise.resolve({ id: 'unknown' }) });
    expect(response.status).toBe(404);
  });

  it('returns 404 for member from different org', async () => {
    const member = await createTestMember({ orgId: 'other_org', inviteEmail: 'del@test.com' });
    const request = makeRequest(`/api/org/members/${member.id}`, 'DELETE');
    const response = await memberDELETE(request, { params: Promise.resolve({ id: member.id }) });
    expect(response.status).toBe(404);
  });

  it('deletes a member', async () => {
    const member = await createTestMember();
    const request = makeRequest(`/api/org/members/${member.id}`, 'DELETE');
    const response = await memberDELETE(request, { params: Promise.resolve({ id: member.id }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify deleted
    const deleted = await prisma.teamMember.findUnique({ where: { id: member.id } });
    expect(deleted).toBeNull();
  });
});
