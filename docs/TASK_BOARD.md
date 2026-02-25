# Task Board - Busala SaaS Implementation

**Current Phase:** Phase 1 - Foundation (Authentication)  
**Status:** 🟡 Planning Complete, Ready to Start  

---

## 🎯 Current Sprint (Week 1)

### P0 - Critical (Do First)

| ID | Task | Status | Owner | Est. Time |
|----|------|--------|-------|-----------|
| 1.1 | Setup Auth0 account and application | 🔴 Not Started | - | 15 min |
| 1.2 | Install Auth0 SDK dependencies | 🔴 Not Started | - | 5 min |
| 1.3 | Create `.env` with Auth0 credentials | 🔴 Not Started | - | 10 min |
| 1.4 | Create `src/lib/auth/auth0.ts` config | 🔴 Not Started | - | 30 min |
| 1.5 | Create Auth0 API route handler | 🔴 Not Started | - | 20 min |
| 1.6 | Create login page | 🔴 Not Started | - | 1 hour |
| 1.7 | Create signup page | 🔴 Not Started | - | 45 min |
| 1.8 | Add Auth0Provider to root layout | 🔴 Not Started | - | 15 min |

### P1 - High Priority (This Week)

| ID | Task | Status | Owner | Est. Time |
|----|------|--------|-------|-----------|
| 1.9 | Create `useAuth` hook | 🔴 Not Started | - | 30 min |
| 1.10 | Create `useUser` hook | 🔴 Not Started | - | 20 min |
| 1.11 | Update `getUserFromRequest()` to use JWT | 🔴 Not Started | - | 1 hour |
| 1.12 | Remove header-based auth from API routes | 🔴 Not Started | - | 2 hours |
| 1.13 | Create auth middleware (`src/middleware.ts`) | 🔴 Not Started | - | 1 hour |
| 1.14 | Add protected route wrapper | 🔴 Not Started | - | 30 min |
| 1.15 | Test auth flow end-to-end | 🔴 Not Started | - | 30 min |

### P2 - Medium Priority (If Time)

| ID | Task | Status | Owner | Est. Time |
|----|------|--------|-------|-----------|
| 1.16 | Add "Remember me" functionality | 🔴 Not Started | - | 30 min |
| 1.17 | Add password reset flow | 🔴 Not Started | - | 45 min |
| 1.18 | Add email verification | 🔴 Not Started | - | 1 hour |
| 1.19 | Create auth error handling | 🔴 Not Started | - | 30 min |

---

## 📋 Task Details

### Task 1.1: Setup Auth0 Account
**Steps:**
1. Go to https://auth0.com/signup
2. Create new account
3. Create new application (Regular Web Application)
4. Configure Callback URLs: `http://localhost:3000/api/auth/callback`
5. Configure Logout URLs: `http://localhost:3000`
6. Note down Client ID, Client Secret, Domain

**Output:** Auth0 application credentials

---

### Task 1.2: Install Auth0 SDK
**Command:**
```bash
npm install @auth0/nextjs-auth0
```

**Output:** Package installed in node_modules

---

### Task 1.3: Create Environment File
**File:** `.env.local`

```bash
# Auth0 Configuration
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN.auth0.com'
AUTH0_CLIENT_ID='YOUR_CLIENT_ID'
AUTH0_CLIENT_SECRET='YOUR_CLIENT_SECRET'
AUTH0_AUDIENCE='https://busala/api'
AUTH0_SCOPE='openid profile email'

# Database (existing)
DATABASE_URL="postgresql://..."
```

**Output:** Environment variables configured

---

### Task 1.4: Create Auth0 Config
**File:** `src/lib/auth/auth0.ts`

```typescript
import { initAuth0 } from '@auth0/nextjs-auth0';

export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  authorizationParams: {
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
  },
});
```

**Output:** Auth0 configuration module

---

### Task 1.5: Create Auth0 API Route
**File:** `src/app/api/auth/[...auth0]/route.ts`

```typescript
import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = handleAuth();
export const POST = handleAuth();
```

**Output:** Auth0 API routes working

---

### Task 1.6: Create Login Page
**File:** `src/app/login/page.tsx`

**Requirements:**
- Clean, centered design
- Busala branding
- "Login with Auth0" button
- Link to signup
- Error display

**Output:** `/login` page functional

---

### Task 1.7: Create Signup Page
**File:** `src/app/signup/page.tsx`

**Requirements:**
- Organization name input
- Admin email/password
- Organization creation on signup
- Terms acceptance
- Email verification prompt

**Output:** `/signup` page functional

---

### Task 1.8: Add Auth0Provider
**File:** `src/app/layout.tsx`

**Changes:**
- Wrap children with UserProvider
- Handle loading states

```typescript
import { UserProvider } from '@auth0/nextjs-auth0/client';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
```

**Output:** Auth context available throughout app

---

### Task 1.11: Update API Authentication
**File:** `src/lib/api-utils.ts`

**Current (Remove):**
```typescript
export function getUserFromRequest(request: Request) {
  const roleHeader = request.headers.get('x-user-role');
  // ... header-based auth
}
```

**New (JWT Based):**
```typescript
import { getSession } from '@auth0/nextjs-auth0';

export async function getUserFromRequest(request: Request) {
  const session = await getSession(request);
  if (!session?.user) {
    return null;
  }
  
  // Get user from database with org info
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  return user;
}
```

**Output:** JWT-based authentication

---

### Task 1.13: Create Auth Middleware
**File:** `src/middleware.ts` (New)

```typescript
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';

export default withMiddlewareAuthRequired(async (req) => {
  const res = NextResponse.next();
  
  // Check if user is authenticated
  const { user } = req.auth;
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Add user info to headers for API routes
  res.headers.set('x-user-id', user.sub);
  res.headers.set('x-user-email', user.email);
  
  return res;
});

export const config = {
  matcher: ['/((?!api/auth|login|signup|_next|favicon.ico).*)'],
};
```

**Output:** Protected routes middleware

---

## ✅ Definition of Done

For each task, the following must be true:

- [ ] Code written and typed (TypeScript)
- [ ] No linting errors (`npm run lint`)
- [ ] Tests passing (`npm test`)
- [ ] Manual testing completed
- [ ] Code committed to `kimi-code` branch

---

## 🚀 Quick Start Commands

```bash
# 1. Install Auth0
npm install @auth0/nextjs-auth0

# 2. Create auth directories
mkdir -p src/lib/auth src/app/api/auth/[...auth0] src/app/login src/app/signup

# 3. Update env
cp .env.example .env.local
# Edit .env.local with Auth0 credentials

# 4. Start dev server
npm run dev

# 5. Test login
open http://localhost:3000/login
```

---

## 📊 Sprint Progress

**Week 1 Progress:** 0/15 tasks (0%)

```
[░░░░░░░░░░░░░░░░░░] 0%
```

---

## 🐛 Known Blockers

| Issue | Impact | Resolution |
|-------|--------|------------|
| None currently | - | - |

---

## 📝 Notes

- All times are estimates
- Tasks can be done in parallel where noted
- Testing should happen continuously, not just at end
- Commit after each major task

---

**Ready to start Task 1.1?** Say "start task 1.1" and I'll begin implementation.
