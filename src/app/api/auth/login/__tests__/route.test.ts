import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { POST } from '../route';

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  it('creates a session and sets a cookie for valid credentials', async () => {
    const hashedPassword = await hashPassword('Password123');

    const user = await prisma.user.create({
      data: {
        email: 'login@test.com',
        name: 'Login Test User',
        hashedPassword,
        role: 'admin',
        orgId: 'org_busala_default',
      },
    });

    const response = await POST(createPostRequest({
      email: 'login@test.com',
      password: 'Password123',
    }));

    const body = await response.json();
    const setCookie = response.headers.get('set-cookie');

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    expect(setCookie).toContain(SESSION_COOKIE_NAME);

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);
  });
});
