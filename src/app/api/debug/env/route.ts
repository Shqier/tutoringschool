// Debug endpoint to check environment variables (remove in production)
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    // Database
    DATABASE_URL: process.env.DATABASE_URL ? 'Set (' + process.env.DATABASE_URL.length + ' chars)' : 'Not set',
    
    // App
    APP_BASE_URL: process.env.APP_BASE_URL || 'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    
    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set (' + process.env.GOOGLE_CLIENT_ID.length + ' chars)' : 'Not set',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'Not set',
    
    // Apple OAuth
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID ? 'Set' : 'Not set',
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID ? 'Set' : 'Not set',
    APPLE_KEY_ID: process.env.APPLE_KEY_ID ? 'Set' : 'Not set',
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY ? 'Set' : 'Not set',
    APPLE_REDIRECT_URI: process.env.APPLE_REDIRECT_URI || 'Not set',
  };

  // Check which OAuth providers are configured
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const appleConfigured = !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);

  return NextResponse.json({
    envVars,
    oauth: {
      google: googleConfigured,
      apple: appleConfigured,
    },
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
}
