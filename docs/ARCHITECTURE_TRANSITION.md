# Architecture Transition Plan

## Current Architecture (Single-Tenant, No Auth)

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Pages (All Public)                                   │  │
│  │  ├── / (Dashboard)  ◄──┐                              │  │
│  │  ├── /teachers         │                              │  │
│  │  ├── /students         │ No Auth                      │  │
│  │  ├── /groups           │                              │  │
│  │  ├── /lessons          │                              │  │
│  │  └── /settings         │                              │  │
│  │                        ▼                              │  │
│  │  Headers: x-user-role: admin ◄── HARDCODED           │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Routes                                           │  │
│  │  └── /api/*                                           │  │
│  │       └─► getUserFromRequest()                        │  │
│  │            └─► Reads headers (INSECURE)               │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Database                                             │  │
│  │  └── PostgreSQL + Prisma                              │  │
│  │       └── org_busala_default (SINGLE)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

🔴 PROBLEMS:
   - No authentication
   - Anyone can be admin by setting headers
   - Single organization only
   - No landing page
```

---

## Target Architecture (SaaS, Multi-Tenant)

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
┌──────────────────┐    ┌─────────────────────────────────────┐
│  Public Routes   │    │  Protected Routes (Requires Auth)   │
│  (No login)      │    │                                     │
│                  │    │  ┌───────────────────────────────┐  │
│  / (Landing)     │    │  │  Dashboard                   │  │
│  /features       │    │  │  ├── Role: Admin/Manager     │  │
│  /pricing        │    │  │  ├── Role: Teacher           │  │
│  /contact        │    │  │  └── Role: Staff             │  │
│  /login ◄────────┼────┼──┼──► Auth Required             │  │
│  /signup         │    │  └───────────────────────────────┘  │
└──────────────────┘    │                                     │
                        │  ┌───────────────────────────────┐  │
                        │  │  Onboarding (New Orgs)       │  │
                        │  │  └── Create organization     │  │
                        │  │      └── Seed data           │  │
                        │  └───────────────────────────────┘  │
                        └─────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  Auth0 Integration                  │
                        │  ├── Login/Logout                   │
                        │  ├── JWT Tokens                     │
                        │  ├── Session Management             │
                        │  └── Role/Permission Management     │
                        └─────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  API Routes (Protected)             │
                        │  └── /api/*                         │
                        │       └─► validateJWT()             │
                        │            └─► Check permissions    │
                        │                 └─► Execute         │
                        └─────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  Database                           │
                        │  └── PostgreSQL + Prisma            │
                        │       ├── org_abc_school            │
                        │       ├── org_xyz_academy           │
                        │       └── org_123_learning          │
                        │           (MULTI-TENANT)            │
                        └─────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  External Services                  │
                        │  ├── Stripe (Billing)               │
                        │  ├── Resend (Email)                 │
                        │  └── S3/R2 (File Storage)           │
                        └─────────────────────────────────────┘

✅ FEATURES:
   - Secure JWT authentication
   - Multi-tenant organizations
   - Role-based access control
   - Public marketing site
   - Subscription billing
```

---

## Migration Path

### Step 1: Add Auth Layer (Week 1)
```
BEFORE:                    AFTER:
                           
┌─────────┐               ┌─────────────┐
│  User   │               │    User     │
└────┬────┘               └──────┬──────┘
     │                           │
     ▼                           ▼
┌─────────┐               ┌─────────────┐
│ Headers │               │  Auth0      │
│ x-role  │               │  Login      │
└────┬────┘               └──────┬──────┘
     │                           │
     ▼                           ▼
┌─────────┐               ┌─────────────┐
│   API   │               │  Middleware │
│ (open)  │               │  (JWT check)│
└────┬────┘               └──────┬──────┘
     │                           │
     ▼                           ▼
┌─────────┐               ┌─────────────┐
│  DB     │               │    API      │
│         │               │  (secured)  │
└─────────┘               └──────┬──────┘
                                 │
                                 ▼
                           ┌─────────────┐
                           │     DB      │
                           └─────────────┘
```

### Step 2: Add Landing Page (Week 2)
```
BEFORE:                    AFTER:

┌─────────┐               ┌─────────────┐
│   /     │               │     /       │
│ (dash)  │               │  (landing)  │
└────┬────┘               └──────┬──────┘
     │                           │
     ▼                           ▼
┌─────────┐               ┌─────────────┐
│  App    │               │  Marketing  │
│ Shell   │               │  Site       │
└─────────┘               └──────┬──────┘
                                 │
                                 ▼
                           ┌─────────────┐
                           │  /login     │
                           │  /signup    │
                           └──────┬──────┘
                                  │
                                  ▼
                            ┌─────────────┐
                            │    App      │
                            │   Shell     │
                            └─────────────┘
```

### Step 3: Multi-Tenancy (Week 3-4)
```
BEFORE:                    AFTER:

Single Org:                Multiple Orgs:

org_busala_default         org_abc_school
      │                          │
      ├── Users                  ├── Users
      ├── Teachers               ├── Teachers
      └── Students               └── Students
                                 
                               org_xyz_academy
                                    │
                                    ├── Users
                                    ├── Teachers
                                    └── Students
```

---

## Data Flow: Authentication

```
1. User visits /login
   │
   ▼
2. Clicks "Login with Auth0"
   │
   ▼
3. Redirected to Auth0
   │
   ▼
4. Auth0 authenticates user
   │
   ▼
5. Callback to /api/auth/callback
   │
   ▼
6. Session created (HTTP-only cookie)
   │
   ▼
7. Redirect to / (Dashboard)
   │
   ▼
8. Middleware checks session
   │
   ▼
9. API calls include session
   │
   ▼
10. API validates JWT
    │
    ▼
11. Return data
```

---

## Data Flow: Multi-Tenancy

```
User: john@abc-school.com
Org: org_abc_school
Role: manager

1. User logs in
   │
   ▼
2. Auth0 returns JWT with email
   │
   ▼
3. System looks up user in DB
   │
   ▼
4. Get orgId from user record
   │
   └─► org_abc_school
   │
   ▼
5. All queries filtered by orgId
   │
   ├─► SELECT * FROM teachers WHERE orgId = 'org_abc_school'
   ├─► SELECT * FROM students WHERE orgId = 'org_abc_school'
   └─► etc.
   │
   ▼
6. User only sees their org's data
```

---

## File Structure Changes

### Before (Current)
```
src/
├── app/
│   ├── page.tsx              # Dashboard (no auth)
│   ├── (app)/
│   │   ├── page.tsx          # Dashboard duplicate
│   │   ├── teachers/
│   │   ├── students/
│   │   └── ...
│   └── api/
│       └── */route.ts        # Header auth
├── lib/
│   ├── api-utils.ts          # Header-based auth
│   └── api/client.ts         # Hardcoded headers
```

### After (Target)
```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── (marketing)/          # Public routes
│   │   ├── layout.tsx
│   │   ├── features/
│   │   ├── pricing/
│   │   └── contact/
│   ├── (app)/                # Protected routes
│   │   ├── layout.tsx        # Auth required
│   │   ├── page.tsx          # Dashboard
│   │   ├── teachers/
│   │   ├── students/
│   │   └── ...
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── signup/
│   │   └── page.tsx          # Signup page
│   └── api/
│       ├── auth/[...auth0]/  # Auth0 routes
│       └── */route.ts        # JWT auth
├── lib/
│   ├── auth/
│   │   ├── auth0.ts          # Auth0 config
│   │   ├── session.ts        # Session management
│   │   └── middleware.ts     # Auth middleware
│   ├── api-utils.ts          # JWT validation
│   └── api/client.ts         # Token management
└── middleware.ts             # Global middleware
```

---

## Dependencies Matrix

| Feature | Dependencies | Blocked By |
|---------|--------------|------------|
| Auth0 Login | `@auth0/nextjs-auth0` | None |
| Protected Routes | Auth0 Login | Auth0 Login |
| API Security | Protected Routes | Protected Routes |
| Landing Page | None | None |
| Org Onboarding | Auth0 Login | Auth0 Login |
| Multi-Tenancy | Org Onboarding | Org Onboarding |
| Billing | Multi-Tenancy, Stripe | Multi-Tenancy |
| RBAC UI | API Security | API Security |

---

## Critical Path

```
Auth0 Account Setup
       │
       ▼
Install Auth0 SDK
       │
       ▼
Create Login Page
       │
       ▼
Create Middleware
       │
       ▼
Secure API Routes
       │
       ▼
Create Landing Page
       │
       ▼
Org Onboarding
       │
       ▼
Multi-Tenancy
       │
       ▼
Billing Integration
```

**Minimum Viable SaaS:** Complete through "Secure API Routes"

---

## Risk Areas

### High Risk
1. **Auth0 Configuration** - Wrong callback URLs break auth
2. **Middleware Performance** - Bad middleware slows all routes
3. **Session Management** - Poor session handling = security holes

### Medium Risk
1. **Database Migration** - Adding auth fields to existing users
2. **URL Structure Changes** - Breaking existing bookmarks
3. **Third-Party Dependencies** - Auth0/Stripe outages

### Mitigation
- Test Auth0 config in staging first
- Implement middleware caching
- Have fallback auth method
- Database backups before migrations
- Feature flags for gradual rollout

---

## Testing Strategy

### Unit Tests
- Auth utility functions
- Permission checking logic
- JWT validation

### Integration Tests
- Login/logout flow
- API route protection
- Role-based access

### E2E Tests
- Complete user journeys
- Org onboarding flow
- Subscription lifecycle

### Security Tests
- JWT token validation
- CSRF protection
- XSS prevention
- SQL injection resistance

---

**Next Step:** Begin with Auth0 account setup (Task 1.1)
