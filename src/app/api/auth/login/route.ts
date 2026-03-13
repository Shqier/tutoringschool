// Login API Route
// Supports email/password and phone/password login

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { 
  verifyPassword, 
  createSession, 
  setSessionCookie 
} from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(1),
  tenantId: z.string().optional(), // Optional - if not provided, will look up by email/phone
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.format() } },
        { status: 400 }
      );
    }

    const { email, phone, password, tenantId: providedTenantId } = result.data;

    // Find user by email or phone
    let user;
    
    if (email) {
      // If tenantId is provided, search within that tenant
      if (providedTenantId) {
        user = await prisma.user.findUnique({
          where: { email_tenantId: { email, tenantId: providedTenantId } },
          include: { tenant: true },
        });
      } else {
        // Find user by email across all tenants
        // This could return multiple users - we'll need to handle this
        const users = await prisma.user.findMany({
          where: { email },
          include: { tenant: true },
        });
        
        if (users.length === 1) {
          user = users[0];
        } else if (users.length > 1) {
          // Multiple tenants found - need tenant selection
          return Response.json(
            { 
              error: { 
                code: 'MULTIPLE_TENANTS', 
                message: 'Multiple organizations found for this email',
                tenants: users.map(u => ({ id: u.tenant.id, name: u.tenant.name, subdomain: u.tenant.subdomain })),
              } 
            },
            { status: 400 }
          );
        }
      }
    } else if (phone) {
      // Search by phone (must provide tenantId for phone lookup)
      if (!providedTenantId) {
        return Response.json(
          { error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required for phone login' } },
          { status: 400 }
        );
      }
      
      user = await prisma.user.findFirst({
        where: { phone, tenantId: providedTenantId },
        include: { tenant: true },
      });
    }

    if (!user) {
      return Response.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' } },
        { status: 401 }
      );
    }

    // Check if user has a password (might be OAuth-only)
    if (!user.hashedPassword) {
      return Response.json(
        { error: { code: 'OAUTH_ONLY', message: 'This account uses social login. Please sign in with Google or Apple.' } },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
      return Response.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' } },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return Response.json(
        { error: { code: 'ACCOUNT_INACTIVE', message: 'Your account has been deactivated' } },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const { token } = await createSession(user.id, {
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    // Set cookie
    await setSessionCookie(token);

    // Return user info (without sensitive data)
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
    });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred during login' } },
      { status: 500 }
    );
  }
}
