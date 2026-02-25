// Test Auth0 initialization
import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Test] Creating Auth0Client...');
    const auth0 = new Auth0Client();
    console.log('[Test] Auth0Client created');
    
    return NextResponse.json({
      status: 'Auth0Client created successfully',
      env: {
        domain: process.env.AUTH0_ISSUER_BASE_URL,
        baseUrl: process.env.AUTH0_BASE_URL,
        clientIdSet: !!process.env.AUTH0_CLIENT_ID,
        secretSet: !!process.env.AUTH0_SECRET,
        clientSecretSet: !!process.env.AUTH0_CLIENT_SECRET,
      }
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      error: 'Failed to create Auth0Client',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
