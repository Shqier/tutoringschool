// Session API Route
// Returns current session info (for client-side auth checks)

export const runtime = 'nodejs';

import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  const result = await getCurrentSession();
  
  if (!result.session || !result.user) {
    return Response.json({ session: null, user: null }, { status: 401 });
  }
  
  // Return user without sensitive data
  return Response.json({
    session: {
      id: result.session.id,
      expiresAt: result.session.expiresAt,
    },
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    },
  });
}
