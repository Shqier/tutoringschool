import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('VALIDATION_ERROR', 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.name.includes('|||')) {
      const [realName, hashedPassword] = user.name.split('|||');
      const valid = await verifyPassword(password, hashedPassword);

      if (!valid) {
        return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      const token = await createToken({
        id: user.id,
        email: user.email,
        name: realName,
        role: user.role,
        orgId: user.orgId,
      });

      await setAuthCookie(token);

      return jsonResponse({
        user: {
          id: user.id,
          email: user.email,
          name: realName,
          role: user.role,
          orgId: user.orgId,
        },
        token,
      });
    }

    // Dev fallback: allow login with any seed user (no password check)
    if (user) {
      const token = await createToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
      });

      await setAuthCookie(token);

      return jsonResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
        },
        token,
      });
    }

    // Auto-create admin user for development convenience
    const newUser = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        role: 'admin',
        orgId: DEFAULT_ORG_ID,
      },
    });

    const token = await createToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      orgId: newUser.orgId,
    });

    await setAuthCookie(token);

    return jsonResponse({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        orgId: newUser.orgId,
      },
      token,
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to log in', 500);
  }
}
