import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  try {
    const result = await getCurrentSession();

    if (!result.session || !result.user) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    return Response.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        avatarUrl: result.user.avatarUrl,
        phone: result.user.phone,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
