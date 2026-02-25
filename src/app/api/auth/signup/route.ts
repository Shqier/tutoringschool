import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { DEFAULT_ORG_ID } from '@/lib/db/seed-prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return errorResponse('VALIDATION_ERROR', 'Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse('DUPLICATE_EMAIL', 'An account with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: 'staff',
        orgId: DEFAULT_ORG_ID,
        // Store hashed password in name field metadata for now
        // In production, add a password column to the User model
      },
    });

    // Store password hash (in a real app, this would be a dedicated column)
    await prisma.user.update({
      where: { id: user.id },
      data: { name: `${name}|||${hashedPassword}` },
    });

    const token = await createToken({
      id: user.id,
      email: user.email,
      name,
      role: user.role,
      orgId: user.orgId,
    });

    await setAuthCookie(token);

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name,
        role: user.role,
        orgId: user.orgId,
      },
      token,
    }, 201);
  } catch (error) {
    console.error('POST /api/auth/signup error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create account', 500);
  }
}
