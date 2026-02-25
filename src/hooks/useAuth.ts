// ============================================
// AUTHENTICATION HOOK
// Wrapper around Auth0's useUser with additional utilities
// ============================================

'use client';

import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export interface User {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  org_id?: string;
  role?: string;
  db_id?: string;
}

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

/**
 * Hook for accessing authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  const { user: auth0User, error, isLoading } = useAuth0User();
  const router = useRouter();

  const user = auth0User as User | null;
  const isAuthenticated = !!user;

  const login = useCallback(() => {
    window.location.href = '/api/auth/login';
  }, []);

  const logout = useCallback(() => {
    window.location.href = '/api/auth/logout';
  }, []);

  const checkSession = useCallback(async () => {
    // Force a session check by refreshing the router
    router.refresh();
  }, [router]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    checkSession,
  };
}

/**
 * Hook that redirects unauthenticated users to login
 */
export function useRequireAuth(redirectTo: string = '/login'): UseAuthReturn {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo]);

  return auth;
}

/**
 * Hook for accessing user role
 */
export function useUserRole(): {
  role: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isTeacher: boolean;
  isStaff: boolean;
} {
  const { user } = useAuth();
  const role = user?.role || null;

  return {
    role,
    isAdmin: role === 'admin',
    isManager: role === 'manager' || role === 'admin',
    isTeacher: role === 'teacher' || role === 'manager' || role === 'admin',
    isStaff: !!role,
  };
}

/**
 * Hook for accessing organization info
 */
export function useOrganization(): {
  orgId: string | null;
  isDefaultOrg: boolean;
} {
  const { user } = useAuth();
  const orgId = user?.org_id || null;

  return {
    orgId,
    isDefaultOrg: orgId === 'org_busala_default',
  };
}
