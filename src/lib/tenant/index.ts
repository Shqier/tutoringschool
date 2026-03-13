// ============================================
// BUSALA TENANT UTILITIES
// ============================================
// Database-dependent functions - Node.js runtime only

import { prisma } from '@/lib/db/prisma';
import type { Tenant } from '@prisma/client';
import {
  TenantContext,
  ResolvedTenant,
  DEFAULT_SUBDOMAIN,
  SUPERADMIN_HOSTS,
  TenantNotFoundError,
  extractSubdomain,
  isSuperAdminHost,
  isTenantActive,
  getTenantSubscriptionStatus,
  buildTenantUrl,
  buildLocalTenantUrl,
} from './types';

// Re-export everything from types
export * from './types';

// ============================================
// TENANT RESOLUTION (DB-dependent)
// ============================================

/**
 * Get tenant by subdomain
 */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  if (!subdomain) return null;
  
  return prisma.tenant.findUnique({
    where: { subdomain },
  });
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  if (!slug) return null;
  
  return prisma.tenant.findUnique({
    where: { slug },
  });
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  if (!id) return null;
  
  return prisma.tenant.findUnique({
    where: { id },
  });
}

/**
 * Resolve tenant from request
 * Priority: 1) Header, 2) Subdomain, 3) Default
 */
export async function resolveTenant(
  hostname: string,
  headers?: Headers
): Promise<TenantContext> {
  // Check for superadmin host first
  if (isSuperAdminHost(hostname)) {
    return {
      tenant: null,
      tenantId: null,
      isSuperAdmin: true,
    };
  }
  
  // Try header first (for API calls or override)
  const headerTenantId = headers?.get('x-tenant-id');
  if (headerTenantId) {
    const tenant = await getTenantById(headerTenantId);
    if (tenant && tenant.isActive && !tenant.suspendedAt) {
      return {
        tenant,
        tenantId: tenant.id,
        isSuperAdmin: false,
      };
    }
  }
  
  // Try subdomain
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    const tenant = await getTenantBySubdomain(subdomain);
    if (tenant && tenant.isActive && !tenant.suspendedAt) {
      return {
        tenant,
        tenantId: tenant.id,
        isSuperAdmin: false,
      };
    }
  }
  
  // No tenant found
  return {
    tenant: null,
    tenantId: null,
    isSuperAdmin: false,
  };
}

/**
 * Require a valid tenant (throws if not found)
 */
export async function requireTenant(hostname: string): Promise<ResolvedTenant> {
  const context = await resolveTenant(hostname);
  
  if (context.isSuperAdmin) {
    throw new Error('SuperAdmin hosts do not have a tenant context');
  }
  
  if (!context.tenant) {
    throw new TenantNotFoundError(`No active tenant found for host: ${hostname}`);
  }
  
  return {
    tenant: context.tenant,
    tenantId: context.tenant.id,
    slug: context.tenant.slug,
    subdomain: context.tenant.subdomain,
  };
}
