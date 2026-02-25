// ============================================
// BUSALA API UTILITIES
// ============================================

import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import type { ApiError, PaginatedResponse, UserRole } from './db/types';

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
 * User info structure from request
 */
export interface RequestUser {
  id: string;
  role: UserRole;
  orgId: string;
  email?: string;
}

/**
 * Get user info from request headers (set by middleware)
 * This is the NEW way - using headers set by auth middleware
 */
export function getUserFromRequest(request: Request): RequestUser {
  // Headers are set by the auth middleware (src/middleware.ts)
  const roleHeader = request.headers.get('x-user-role') as UserRole | null;
  const userIdHeader = request.headers.get('x-user-id');
  const orgIdHeader = request.headers.get('x-org-id');
  const emailHeader = request.headers.get('x-user-email');

  // If headers are missing, we're in an unprotected route or middleware failed
  if (!userIdHeader || !roleHeader || !orgIdHeader) {
    // Check if we're in development mode with explicit dev headers
    const devRole = request.headers.get('x-dev-role') as UserRole | null;
    if (process.env.NODE_ENV === 'development' && devRole) {
      return {
        id: 'dev_user',
        role: devRole,
        orgId: 'org_busala_default',
        email: 'dev@busala.com',
      };
    }
    
    // Return minimal permissions for unauthenticated requests
    return {
      id: 'anonymous',
      role: 'staff',
      orgId: 'org_busala_default',
      email: undefined,
    };
  }

  return {
    id: userIdHeader,
    role: roleHeader,
    orgId: orgIdHeader,
    email: emailHeader || undefined,
  };
}

/**
 * Require minimum role middleware helper
 */
export function requireRole(request: Request, minimumRole: UserRole): {
  authorized: boolean;
  user: RequestUser;
  errorResponse?: NextResponse;
} {
  const user = getUserFromRequest(request);
  
  // Check if user is authenticated
  if (user.id === 'anonymous') {
    return {
      authorized: false,
      user,
      errorResponse: errorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        401
      ),
    };
  }
  
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

/**
 * Require authentication only (any role)
 */
export function requireAuth(request: Request): {
  authenticated: boolean;
  user: RequestUser;
  errorResponse?: NextResponse;
} {
  const user = getUserFromRequest(request);
  
  if (user.id === 'anonymous') {
    return {
      authenticated: false,
      user,
      errorResponse: errorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        401
      ),
    };
  }
  
  return { authenticated: true, user };
}
