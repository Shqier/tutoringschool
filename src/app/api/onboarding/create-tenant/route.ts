// Create tenant and owner user during onboarding

export const runtime = 'nodejs';

import { prisma } from '@/lib/db/prisma';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';

const createTenantSchema = z.object({
  tenant: z.object({
    name: z.string().min(2),
    subdomain: z.string().min(2).regex(/^[a-z0-9-]+$/),
    email: z.string().email(),
  }),
  owner: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createTenantSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.format() } },
        { status: 400 }
      );
    }

    const { tenant: tenantData, owner: ownerData } = result.data;

    // Check if subdomain is available
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: tenantData.subdomain },
    });

    if (existingTenant) {
      return Response.json(
        { error: { code: 'SUBDOMAIN_TAKEN', message: 'Subdomain is already taken' } },
        { status: 409 }
      );
    }

    // Get the default plan (Starter)
    const defaultPlan = await prisma.plan.findFirst({
      where: { slug: 'starter', isActive: true },
    });

    if (!defaultPlan) {
      return Response.json(
        { error: { code: 'NO_DEFAULT_PLAN', message: 'No default plan found' } },
        { status: 500 }
      );
    }

    // Create tenant and owner in a transaction
    let tenant;
    let owner;
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant
        const t = await tx.tenant.create({
          data: {
            name: tenantData.name,
            slug: tenantData.subdomain,
            subdomain: tenantData.subdomain,
            email: tenantData.email,
            planId: defaultPlan.id,
            subscriptionStatus: 'trial',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            settings: {
              theme: 'dark',
              language: 'en',
              timezone: 'America/New_York',
            },
          },
        });

        // Hash password
        const hashedPassword = await hashPassword(ownerData.password);
        // Creating user...

        // Create owner user
        const u = await tx.user.create({
          data: {
            name: ownerData.name,
            email: ownerData.email,
            phone: ownerData.phone,
            hashedPassword,
            tenantId: t.id,
            role: 'owner',
            emailVerified: true, // Auto-verify for now
          },
        });

        return { tenant: t, owner: u };
      });
      tenant = result.tenant;
      owner = result.owner;
    } catch (txError: any) {
      // Transaction error logged
      throw txError;
    }

    // Create session and set cookie
    const { token } = await createSession(owner.id, {
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    await setSessionCookie(token);

    // Return success with tenant info
    return Response.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      user: {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: owner.role,
      },
    }, { status: 201 });

  } catch (error: any) {
    // Error logged
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: error?.message || 'Failed to create account' } },
      { status: 500 }
    );
  }
}
