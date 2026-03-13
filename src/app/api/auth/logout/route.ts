// Logout API Route

export const runtime = 'nodejs';

import { invalidateSession, deleteSessionCookie, getSessionToken, validateSessionToken } from '@/lib/auth';

export async function POST() {
  try {
    // Get current session
    const token = await getSessionToken();
    if (token) {
      const result = await validateSessionToken(token);
      if (result.session) {
        // Invalidate session in database
        await invalidateSession(result.session.id);
      }
    }

    // Clear cookie
    await deleteSessionCookie();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookie even if DB operation fails
    await deleteSessionCookie();
    return Response.json({ success: true });
  }
}
