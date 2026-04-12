// ============================================
// AUTH LOGIN API
// POST /api/auth/login - Authenticate with email + password
// ============================================

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { errorResponse } from '@/lib/api-utils';
import { verifyPassword, signSessionToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/login
 * Validates email/password, sets a signed session cookie on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid email or password format', 400);
    }

    const { email, password } = result.data;

    const user = await prisma.user.findFirst({ where: { email } });

    // Use a constant-time generic message to prevent user enumeration
    if (!user || !user.hashedPassword) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const valid = await verifyPassword(password, user.hashedPassword);
    if (!valid) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const token = signSessionToken({ id: user.id, orgId: user.orgId, role: user.role });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
        },
      },
      { status: 200 }
    );

    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return errorResponse('INTERNAL_ERROR', 'Login failed', 500);
  }
}
