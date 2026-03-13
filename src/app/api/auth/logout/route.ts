import { NextRequest } from 'next/server';
import { getSessionToken, validateSessionToken, invalidateSession, deleteSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken();
    
    if (token) {
      const result = await validateSessionToken(token);
      if (result.session) {
        await invalidateSession(result.session.id);
      }
    }

    await deleteSessionCookie();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred during logout' } },
      { status: 500 }
    );
  }
}
