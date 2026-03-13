---
name: busala-auth
description: Authentication and authorization for Busala School Management System using Auth0. Use when implementing login, logout, session management, role-based access control, or protecting routes. Covers Auth0 OAuth flow, session handling, middleware, and role permissions.
---

# Busala Authentication & Authorization

## Architecture

- **Provider**: Auth0 (OAuth 2.0)
- **Session**: HTTP-only cookies
- **Roles**: admin, manager, teacher, staff
- **Middleware**: Next.js Edge Middleware

## Auth Flow

```
1. User visits /login
2. Clicks "Sign in with Auth0"
3. Redirected to Auth0 (/authorize)
4. User authenticates with Auth0
5. Callback to /api/auth/callback (with code)
6. Exchange code for tokens
7. Set session cookie
8. Redirect to dashboard
```

## Environment Variables

```bash
# Required
AUTH0_SECRET='32-byte-hex-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='your-domain.us.auth0.com'  # No https://
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# Optional
AUTH0_SCOPE='openid profile email'
AUTH0_AUDIENCE='https://busala/api'
```

## Auth API Routes

### Login

```typescript
// src/app/api/auth/login/route.ts
export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.AUTH0_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/auth/callback`,
    scope: 'openid profile email',
    state: Buffer.from(JSON.stringify({ returnTo })).toString('base64'),
  });

  return NextResponse.redirect(
    `https://${domain}/authorize?${params.toString()}`
  );
}
```

### Callback

```typescript
// src/app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  // Exchange code for tokens
  const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      code,
      redirect_uri: `${baseUrl}/api/auth/callback`,
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Get user info
  const userResponse = await fetch(`https://${domain}/userinfo`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  
  const userInfo = await userResponse.json();
  
  // Set session cookie
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('appSession', JSON.stringify({
    user: userInfo,
    accessToken: tokens.access_token,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return response;
}
```

## Middleware

```typescript
// src/middleware.ts
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  
  // Public paths
  const PUBLIC_PATHS = ['/login', '/signup', '/api/auth'];
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return res;
  }
  
  // Check session
  const sessionCookie = req.cookies.get('appSession');
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Add user headers for API routes
  if (pathname.startsWith('/api/')) {
    const session = JSON.parse(sessionCookie.value);
    res.headers.set('x-user-id', session.user.sub);
    res.headers.set('x-user-email', session.user.email);
    res.headers.set('x-user-role', session.user.role || 'staff');
  }
  
  return res;
}
```

## Role-Based Access Control

### Role Hierarchy

```
admin (4)     → Full access, delete operations
manager (3)   → Create, update resources
teacher (2)   → View own data, manage availability
staff (1)     → Read-only access
```

### Check Role in API

```typescript
import { requireRole } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const { authorized, user, errorResponse } = requireRole(request, 'manager');
  if (!authorized) return errorResponse;
  
  // User is authorized, proceed...
}
```

### Check Role in UI

```typescript
import { useUserRole } from '@/hooks/useAuth';

export function MyComponent() {
  const { isAdmin, isManager, isTeacher, role } = useUserRole();
  
  return (
    <div>
      {isAdmin && <DeleteButton />}
      {isManager && <EditButton />}
    </div>
  );
}
```

## Auth Hooks

### useAuth

```typescript
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <div>Hello {user.name}</div>;
}
```

### useRequireAuth

```typescript
import { useRequireAuth } from '@/hooks/useAuth';

export function ProtectedPage() {
  const { user, isLoading } = useRequireAuth();
  
  if (isLoading) return <Loading />;
  
  return <div>Protected content</div>;
}
```

## Protecting Routes

### Client-Side

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading || !isAuthenticated) {
    return <Loading />;
  }
  
  return children;
}
```

### Server-Side (Middleware)

Already handled in `src/middleware.ts` - redirects unauthenticated users to `/login`.

## User Sync

When users first log in, sync them to the database:

```typescript
// In callback handler
const dbUser = await prisma.user.findUnique({
  where: { email: userInfo.email },
});

if (!dbUser) {
  await prisma.user.create({
    data: {
      email: userInfo.email,
      name: userInfo.name || userInfo.email.split('@')[0],
      role: 'staff', // Default role
      orgId: 'org_busala_default',
    },
  });
}
```

## Logout

```typescript
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set('appSession', '', { maxAge: 0 });
  return response;
}
```

## Best Practices

1. Always use HTTPS in production
2. Set `httpOnly` and `secure` flags on cookies
3. Validate session on every request
4. Sync users to database on first login
5. Use role hierarchy for authorization
6. Log auth events for security monitoring
