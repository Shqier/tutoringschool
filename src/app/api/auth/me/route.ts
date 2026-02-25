import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const user = await verifyToken(token);

    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Invalid or expired session', 401);
    }

    return jsonResponse({ user });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to get user', 500);
  }
}
