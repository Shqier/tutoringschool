// Google OAuth Initiation Route
// Redirects user to Google for authentication

export const runtime = 'nodejs';

import { createGoogleAuthorizationUrl } from '@/lib/auth';

export async function GET() {
  try {
    const { url } = await createGoogleAuthorizationUrl();
    return Response.redirect(url);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return Response.redirect(new URL('/login?error=oauth_not_configured', process.env.APP_BASE_URL ?? 'http://localhost:3000'));
  }
}
