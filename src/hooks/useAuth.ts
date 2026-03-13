// ============================================
// AUTHENTICATION HOOK
// Custom auth using our session-based authentication
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

/**
 * Hook for accessing authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      setUser(data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
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
  isOwner: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  isTeacher: boolean;
  isStaff: boolean;
} {
  const { user } = useAuth();
  const role = user?.role || null;

  return {
    role,
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isCoordinator: role === 'coordinator' || role === 'admin' || role === 'owner',
    isTeacher: role === 'teacher' || role === 'coordinator' || role === 'admin' || role === 'owner',
    isStaff: !!role,
  };
}

/**
 * Hook for accessing organization info
 */
export function useOrganization(): {
  tenantId: string | null;
} {
  // Tenant info comes from the user context in a real implementation
  // For now, return null - the tenant is resolved server-side
  return {
    tenantId: null,
  };
}
