// ============================================
// SUPER ADMIN LOGIN API
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

const SUPERADMIN_COOKIE = 'superadminSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return Response.json(
        { error: { code: 'INVALID_INPUT', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Find superadmin user
    const superAdmin = await prisma.superAdminUser.findUnique({
      where: { email },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return Response.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Verify password (in production, use bcrypt.compare)
    // For now, simple comparison (TODO: implement proper hashing)
    const isValidPassword = password === 'admin123';
    
    if (!isValidPassword) {
      return Response.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.superAdminUser.update({
      where: { id: superAdmin.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session data
    const sessionData = {
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
        type: 'superadmin',
      },
      createdAt: Date.now(),
    };

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SUPERADMIN_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Return success
    return Response.json({
      success: true,
      user: sessionData.user,
    });
  } catch (error) {
    console.error('[SuperAdmin Login Error]:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
