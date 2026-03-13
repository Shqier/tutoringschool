// Apple OAuth Initiation Route
// Redirects user to Apple for authentication

export const runtime = 'nodejs';

import { createAppleAuthorizationUrl } from '@/lib/auth';

export async function GET() {
  try {
    const { url } = await createAppleAuthorizationUrl();
    return Response.redirect(url);
  } catch (error) {
    console.error('Apple OAuth initiation error:', error);
    return Response.redirect(new URL('/login?error=oauth_not_configured', process.env.APP_BASE_URL ?? 'http://localhost:3000'));
  }
}
