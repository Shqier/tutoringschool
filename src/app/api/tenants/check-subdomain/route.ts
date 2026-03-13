// Check if subdomain is available

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');

  if (!subdomain) {
    return Response.json(
      { error: { code: 'MISSING_SUBDOMAIN', message: 'Subdomain is required' } },
      { status: 400 }
    );
  }

  // Validate subdomain format
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return Response.json(
      { 
        available: false, 
        error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' 
      }
    );
  }

  // Check if subdomain is reserved
  const reservedSubdomains = [
    'www', 'api', 'admin', 'app', 'dashboard', 'login', 'signup',
    'superadmin', 'support', 'help', 'docs', 'blog', 'status',
    'mail', 'email', 'smtp', 'ftp', 'sftp', 'ssh', 'git',
    'busala', 'demo', 'test', 'staging', 'dev', 'localhost',
  ];
  
  if (reservedSubdomains.includes(subdomain)) {
    return Response.json(
      { 
        available: false, 
        error: 'This subdomain is reserved' 
      }
    );
  }

  // Check if subdomain exists
  const existing = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (existing) {
    return Response.json({
      available: false,
      error: `The subdomain '${subdomain}' is already taken. Please choose another.`,
    });
  }

  return Response.json({
    available: true,
    subdomain,
  });
}
