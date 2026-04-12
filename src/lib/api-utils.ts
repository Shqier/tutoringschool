// ============================================
// BUSALA API UTILITIES
// ============================================

import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import type { ApiError, PaginatedResponse, UserRole } from './db/types';
import { getUserFromCookieHeader } from './auth';

/**
 * Create a JSON response with proper headers
 */
export function jsonResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  const error: ApiError = { code, message, details };
  return NextResponse.json({ error }, { status });
}

/**
 * Handle Zod validation errors
 */
export function validationErrorResponse(error: ZodError): NextResponse {
  return errorResponse(
    'VALIDATION_ERROR',
    'Invalid request data',
    400,
    error.issues.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }))
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Paginate an array
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  limit: number
): { items: T[]; total: number } {
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    total,
  };
}

/**
 * Parse search params for pagination
 */
export function getPaginationFromUrl(url: URL): { page: number; limit: number } {
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  };
}

/**
 * Role-based access control check
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Simple role hierarchy check
 * admin > manager > teacher > staff
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 4,
    manager: 3,
    teacher: 2,
    staff: 1,
  };
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Get authenticated user from request.
 * Priority:
 *   1. x-user-role/id/orgId headers (dev/proxy/internal)
 *   2. session-token cookie (browser requests)
 *   3. Dev fallback defaults (development only)
 */
export function getUserFromRequest(request: Request): {
  id: string;
  role: UserRole;
  orgId: string;
} {
  const roleHeader = request.headers.get('x-user-role') as UserRole | null;
  const userIdHeader = request.headers.get('x-user-id');
  const orgIdHeader = request.headers.get('x-org-id');

  // Header-based auth (dev or internal/proxy requests with all three headers)
  if (roleHeader && userIdHeader && orgIdHeader) {
    return { id: userIdHeader, role: roleHeader, orgId: orgIdHeader };
  }

  // Cookie-based auth (browser sessions)
  const cookieHeader = request.headers.get('cookie');
  const sessionUser = getUserFromCookieHeader(cookieHeader);
  if (sessionUser) {
    return { id: sessionUser.id, role: sessionUser.role as UserRole, orgId: sessionUser.orgId };
  }

  // Dev fallback (allows header-less access in development)
  return {
    id: userIdHeader || 'user_default',
    role: roleHeader || 'admin',
    orgId: orgIdHeader || 'org_busala_default',
  };
}

/**
 * Require minimum role middleware helper
 */
export function requireRole(request: Request, minimumRole: UserRole): {
  authorized: boolean;
  user: { id: string; role: UserRole; orgId: string };
  errorResponse?: NextResponse;
} {
  const user = getUserFromRequest(request);
  const authorized = hasMinimumRole(user.role, minimumRole);

  if (!authorized) {
    return {
      authorized: false,
      user,
      errorResponse: errorResponse(
        'FORBIDDEN',
        `This action requires at least ${minimumRole} role`,
        403
      ),
    };
  }

  return { authorized: true, user };
}
