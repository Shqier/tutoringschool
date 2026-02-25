// Debug endpoint to check environment variables (remove in production)
import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    AUTH0_SECRET: process.env.AUTH0_SECRET ? 'Set (' + process.env.AUTH0_SECRET.length + ' chars)' : 'Not set',
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL || 'Not set',
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || 'Not set',
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? 'Set (' + process.env.AUTH0_CLIENT_ID.length + ' chars)' : 'Not set',
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? 'Set (' + process.env.AUTH0_CLIENT_SECRET.length + ' chars)' : 'Not set',
    AUTH0_SCOPE: process.env.AUTH0_SCOPE || 'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set',
  };

  // Validate required vars
  const required = ['AUTH0_SECRET', 'AUTH0_BASE_URL', 'AUTH0_ISSUER_BASE_URL', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  return NextResponse.json({
    envVars,
    status: missing.length === 0 ? 'OK' : 'Missing variables',
    missing,
    timestamp: new Date().toISOString(),
  });
}
