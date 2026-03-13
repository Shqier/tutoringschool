// ============================================
// ROLES API
// GET /api/roles - Roles with permissions and user counts
// ============================================

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['All Access'],
  manager: ['Manage Schedule', 'Manage Teachers', 'Manage Students', 'Manage Groups', 'Manage Rooms', 'View Reports', 'Approve Requests'],
  teacher: ['View Classes', 'Mark Attendance', 'View Students', 'View Schedule', 'Confirm Availability'],
  staff: ['View Schedule', 'View Students', 'View Teachers', 'View Groups', 'View Rooms'],
};

/**
 * GET /api/roles
 * Returns roles with permissions and user count per role for current org.
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const counts = await prisma.user.groupBy({
      by: ['role'],
      where: { orgId: user.orgId },
      _count: { id: true },
    });

    const roles = (['admin', 'manager', 'teacher', 'staff'] as const).map((role, index) => ({
      id: String(index + 1),
      role: role.charAt(0).toUpperCase() + role.slice(1),
      permissions: ROLE_PERMISSIONS[role] ?? [],
      usersCount: counts.find((c) => c.role === role)?._count.id ?? 0,
    }));

    return jsonResponse({ roles });
  } catch (error) {
    console.error('GET /api/roles error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch roles', 500);
  }
}
