// ============================================
// BUSALA TENANT TYPES & CONSTANTS
// ============================================
// Pure types and constants - safe for Edge Runtime

import type { Tenant } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface TenantContext {
  tenant: Tenant | null;
  tenantId: string | null;
  isSuperAdmin: boolean;
}

export interface ResolvedTenant {
  tenant: Tenant;
  tenantId: string;
  slug: string;
  subdomain: string;
}

// ============================================
// CONSTANTS
// ============================================

export const SUPERADMIN_HOSTS = ['admin.busala.com', 'admin.localhost', 'localhost'];
export const DEFAULT_SUBDOMAIN = 'demo';

// ============================================
// PURE FUNCTIONS (Safe for Edge Runtime)
// ============================================

/**
 * Extract subdomain from hostname
 * e.g., "cairo-academy.busala.com" → "cairo-academy"
 */
export function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];
  
  if (host === 'localhost' || host === '127.0.0.1') {
    return DEFAULT_SUBDOMAIN;
  }
  
  if (SUPERADMIN_HOSTS.includes(host)) {
    return null;
  }
  
  const parts = host.split('.');
  
  if (parts.length < 3) {
    return null;
  }
  
  return parts[0];
}

/**
 * Check if hostname is a superadmin host
 */
export function isSuperAdminHost(hostname: string): boolean {
  const host = hostname.split(':')[0];
  return SUPERADMIN_HOSTS.includes(host) || host === 'localhost';
}

// ============================================
// ERRORS
// ============================================

export class TenantNotFoundError extends Error {
  constructor(message: string = 'Tenant not found') {
    super(message);
    this.name = 'TenantNotFoundError';
  }
}

export class TenantSuspendedError extends Error {
  constructor(message: string = 'Tenant account is suspended') {
    super(message);
    this.name = 'TenantSuspendedError';
  }
}

export class TenantTrialExpiredError extends Error {
  constructor(message: string = 'Trial period has expired') {
    super(message);
    this.name = 'TenantTrialExpiredError';
  }
}

// ============================================
// TENANT STATUS CHECKS (Pure functions)
// ============================================

export function isTenantActive(tenant: Tenant): boolean {
  if (!tenant.isActive) return false;
  if (tenant.suspendedAt) return false;
  
  if (tenant.subscriptionStatus === 'trial' && tenant.trialEndsAt) {
    return new Date(tenant.trialEndsAt) > new Date();
  }
  
  return ['trial', 'active'].includes(tenant.subscriptionStatus);
}

export function getTenantSubscriptionStatus(tenant: Tenant): {
  isActive: boolean;
  status: string;
  daysUntilExpiration: number | null;
} {
  const now = new Date();
  let daysUntilExpiration: number | null = null;
  
  if (tenant.subscriptionStatus === 'trial' && tenant.trialEndsAt) {
    const trialEnd = new Date(tenant.trialEndsAt);
    daysUntilExpiration = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else if (tenant.currentPeriodEnd) {
    const periodEnd = new Date(tenant.currentPeriodEnd);
    daysUntilExpiration = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return {
    isActive: isTenantActive(tenant),
    status: tenant.subscriptionStatus,
    daysUntilExpiration,
  };
}

// ============================================
// URL BUILDERS
// ============================================

export function buildTenantUrl(subdomain: string, baseDomain: string = 'busala.com'): string {
  return `https://${subdomain}.${baseDomain}`;
}

export function buildLocalTenantUrl(subdomain: string, port: number = 3000): string {
  return `http://${subdomain}.localhost:${port}`;
}
