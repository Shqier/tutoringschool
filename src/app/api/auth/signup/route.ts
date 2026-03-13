// Signup API Route
// For creating new user accounts within a tenant

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { 
  hashPassword, 
  validatePasswordStrength,
  createSession, 
  setSessionCookie 
} from '@/lib/auth';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantId: z.string(),
  role: z.enum(['owner', 'admin', 'coordinator', 'teacher', 'staff']).default('staff'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.format() } },
        { status: 400 }
      );
    }

    const { name, email, phone, password, tenantId, role } = result.data;

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return Response.json(
        { error: { code: 'WEAK_PASSWORD', message: 'Password does not meet requirements', details: passwordCheck.errors } },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return Response.json(
        { error: { code: 'TENANT_NOT_FOUND', message: 'Organization not found' } },
        { status: 404 }
      );
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });

    if (existingUser) {
      return Response.json(
        { error: { code: 'USER_EXISTS', message: 'An account with this email already exists in this organization' } },
        { status: 409 }
      );
    }

    // Check tenant limits
    const userCount = await prisma.user.count({ where: { tenantId } });
    const plan = await prisma.plan.findUnique({
      where: { id: tenant.planId },
    });

    if (plan && userCount >= plan.maxTeachers) {
      return Response.json(
        { error: { code: 'PLAN_LIMIT', message: 'This organization has reached its user limit' } },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        hashedPassword,
        tenantId,
        role: role as UserRole,
      },
      include: { tenant: true },
    });

    // Create session
    const { token } = await createSession(user.id, {
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    // Set cookie
    await setSessionCookie(token);

    // Return user info
    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain,
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred during signup' } },
      { status: 500 }
    );
  }
}
