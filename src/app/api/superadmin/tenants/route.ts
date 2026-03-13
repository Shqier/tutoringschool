// ============================================
// SUPER ADMIN - TENANTS API
// ============================================


export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for creating a tenant
const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Subdomain must be lowercase alphanumeric with hyphens'),
  email: z.string().email(),
  phone: z.string().optional(),
  planId: z.string(),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1),
});

/**
 * GET /api/superadmin/tenants
 * List all tenants with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const status = searchParams.get('status');
    const planId = searchParams.get('planId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.subscriptionStatus = status;
    }
    
    if (planId && planId !== 'all') {
      where.planId = planId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get total count
    const total = await prisma.tenant.count({ where });
    
    // Get tenants with pagination
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        plan: {
          select: {
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            users: true,
            teachers: true,
            students: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return Response.json({
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('[SuperAdmin Tenants GET Error]:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tenants' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/tenants
 * Create a new tenant with owner user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.issues } },
        { status: 400 }
      );
    }
    
    const { name, slug, subdomain, email, phone, planId, ownerEmail, ownerName } = parsed.data;
    
    // Check if slug or subdomain already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ slug }, { subdomain }],
      },
    });
    
    if (existingTenant) {
      return Response.json(
        { error: { code: 'DUPLICATE_ERROR', message: 'Slug or subdomain already exists' } },
        { status: 409 }
      );
    }
    
    // Create tenant and owner in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          subdomain,
          email,
          phone,
          planId,
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });
      
      // Create owner user
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: ownerEmail,
          name: ownerName,
          role: 'owner',
          isActive: true,
        },
      });
      
      // Log the creation
      await tx.platformAuditLog.create({
        data: {
          action: 'tenant.created',
          entityType: 'tenant',
          entityId: tenant.id,
          after: tenant as any,
          metadata: { ownerId: owner.id },
        },
      });
      
      return { tenant, owner };
    });
    
    return Response.json({
      success: true,
      data: {
        tenant: result.tenant,
        owner: {
          id: result.owner.id,
          email: result.owner.email,
          name: result.owner.name,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[SuperAdmin Tenants POST Error]:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create tenant' } },
      { status: 500 }
    );
  }
}
