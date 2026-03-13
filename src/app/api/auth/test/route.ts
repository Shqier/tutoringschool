// Test auth initialization
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isOAuthConfigured } from '@/lib/auth';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    
    return NextResponse.json({
      status: 'Authentication system ready',
      database: {
        connected: true,
        userCount,
        tenantCount,
      },
      oauth: {
        google: isOAuthConfigured('google'),
        apple: isOAuthConfigured('apple'),
      },
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      error: 'Failed to test auth system',
      message: error.message,
    }, { status: 500 });
  }
}
