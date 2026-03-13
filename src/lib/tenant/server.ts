// Server-side tenant utilities
// Only use in Server Components

import { prisma } from '@/lib/db/prisma';

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string | null;
}

/**
 * Get tenant info from request host/subdomain
 * For server components only
 */
export async function getTenantFromRequest(host: string): Promise<TenantInfo | null> {
  // Extract subdomain from host
  const isLocalhost = host.includes('localhost');
  
  let subdomain: string | null = null;
  
  if (isLocalhost) {
    // localhost:3000 or subdomain.localhost:3000
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      subdomain = parts[0].split(':')[0]; // Remove port if present
    }
  } else {
    // Production: subdomain.classhub.io
    const parts = host.split('.');
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  if (!subdomain || subdomain === 'www') {
    return null;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logoUrl: true,
      },
    });

    return tenant;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}
