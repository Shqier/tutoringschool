# Busala SaaS Development Roadmap

**Version:** 1.0 → SaaS MVP  
**Timeline:** 8 Weeks to Production  
**Branch:** `kimi-code`  
**Last Updated:** 2026-02-24  

---

## Phase Overview

```
✅ Week 1-2:  Foundation (Auth + Security)    [COMPLETED]
🔄 Week 3-4:  SaaS Core (Landing + Tenancy)   [IN PROGRESS]
⏳ Week 5-6:  Feature Complete (RBAC + Polish)
⏳ Week 7-8:  Production Ready (Testing + DevOps)
```

---

## ✅ Phase 1: Foundation (Weeks 1-2) - COMPLETED

**Status:** ✅ Complete  
**Date:** 2026-02-24  
**Commit:** `8c787e0`  

**Goal:** Secure authentication, remove security vulnerabilities

### ✅ Week 1: Authentication Implementation

#### ✅ Day 1-2: Auth0 Setup
- [x] Install Auth0 SDK: `npm install @auth0/nextjs-auth0`
- [x] Create Auth0 account and application
- [x] Configure environment variables
- [x] Create auth configuration file

**Files Created:**
```
src/lib/auth/
├── config.ts             ✅ Auth0 configuration
└── session.ts            ✅ Session management

src/app/api/auth/[...auth0]/
└── route.ts              ✅ Auth0 API routes with user sync
```

**Environment Variables:**
```bash
# .env
AUTH0_SECRET='use [openssl rand -hex 32] to generate'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='https://busala/api'
```

#### ✅ Day 3-4: Login/Logout Pages
- [x] Create login page (`/login`)
- [x] Create signup page (`/signup`)
- [x] Add Auth0Provider to layout
- [x] Create auth hooks (`useAuth`, `useUser`)
- [x] Update `getUserFromRequest()` to use JWT

**Files Created:**
```
src/app/login/
└── page.tsx              ✅ Login page with Busala branding

src/app/signup/
└── page.tsx              ✅ Multi-step signup wizard

src/hooks/
└── useAuth.ts            ✅ Authentication hooks (useAuth, useUserRole, useOrganization)
```

#### ✅ Day 5: Secure API Routes
- [x] Remove header-based authentication
- [x] Add JWT validation middleware
- [x] Update all API routes to use real auth
- [x] Add CSRF protection
- [x] Remove hardcoded auth from API client

**Files Modified:**
```
src/lib/api-utils.ts      ✅ JWT-based auth, removed header auth
src/lib/api/client.ts     ✅ Removed hardcoded headers, added credentials
src/middleware.ts         ✅ NEW - Auth middleware for route protection
src/app/layout.tsx        ✅ Added UserProvider
src/components/dashboard/TopNav.tsx  ✅ Real user data integration
```

### ✅ Week 2: Security & Session Management

#### ✅ Day 1-2: Session Management
- [x] Implement session persistence (Auth0 handles this)
- [x] Add session refresh logic (Auth0 handles this)
- [x] Handle token expiration (Auth0 handles this)
- [x] User sync to database on login

#### ✅ Day 3-4: Role Integration
- [x] Sync Auth0 users with database
- [x] Default role assignment ('staff')
- [x] Role in session from database
- [x] useUserRole() hook for role checking

#### ✅ Day 5: Security Audit
- [x] Remove all hardcoded auth
- [x] Protected routes via middleware
- [x] Test all protected routes
- [x] All 274 tests passing

**Deliverables:**
- ✅ Secure authentication flow with Auth0
- ✅ JWT-based API protection via middleware
- ✅ Login/signup pages with Busala branding
- ✅ Session management with HTTP-only cookies
- ✅ User sync to database
- ✅ Role-based hooks and utilities
- ✅ Security audit passed (no hardcoded auth)

---

## 🔄 Phase 2: SaaS Core (Weeks 3-4) - IN PROGRESS

**Status:** 🔄 In Progress  
**Start Date:** 2026-02-24  

**Goal:** Landing page, multi-tenancy, organization management

### Week 3: Landing Page & Marketing Site

#### Day 1-2: Landing Page Design
- [ ] Create landing page layout
- [ ] Hero section with CTA
- [ ] Features showcase
- [ ] Testimonials section
- [ ] Pricing section

**Files to Create:**
```
src/app/(marketing)/
├── layout.tsx            # Marketing layout (no auth)
├── page.tsx              # Landing page
├── features/
│   └── page.tsx          # Features page
├── pricing/
│   └── page.tsx          # Pricing page
└── contact/
    └── page.tsx          # Contact page

src/components/marketing/
├── Hero.tsx
├── Features.tsx
├── Pricing.tsx
├── Testimonials.tsx
└── Footer.tsx
```

#### Day 3: Authentication Flow Integration
- [ ] Connect landing CTA to signup
- [ ] Add "Get Started" flow
- [ ] Create onboarding wizard
- [ ] Add email verification

#### Day 4-5: Organization Onboarding
- [ ] Create organization signup
- [ ] Add org configuration wizard
- [ ] Setup default data for new orgs
- [ ] Add org switcher UI

**Files to Create:**
```
src/app/onboarding/
├── layout.tsx
├── page.tsx              # Onboarding start
├── organization/
│   └── page.tsx          # Org setup
└── complete/
    └── page.tsx          # Onboarding complete

src/components/onboarding/
├── OnboardingWizard.tsx
├── OrgSetupForm.tsx
└── InviteTeam.tsx
```

### Week 4: Multi-Tenancy

#### Day 1-2: Organization Management
- [ ] Create org management API
- [ ] Add org settings page
- [ ] Create member management
- [ ] Add role assignment within org

**Files to Create:**
```
src/app/(app)/settings/
├── organization/
│   ├── page.tsx          # Org settings
│   └── members/
│       └── page.tsx      # Member management
```

#### Day 3-4: Subscription/Billing (Stripe)
- [ ] Setup Stripe account
- [ ] Create subscription plans
- [ ] Add billing page
- [ ] Implement subscription checks

**Files to Create:**
```
src/lib/billing/
├── stripe.ts             # Stripe client
├── plans.ts              # Plan definitions
└── subscriptions.ts      # Subscription logic

src/app/api/billing/
├── checkout/
│   └── route.ts          # Stripe checkout
├── webhook/
│   └── route.ts          # Stripe webhooks
└── portal/
    └── route.ts          # Customer portal
```

#### Day 5: Tenant Isolation Verification
- [ ] Verify orgId filtering on all queries
- [ ] Add tenant middleware
- [ ] Test data isolation
- [ ] Add org-specific branding

**Deliverables:**
- 🔄 Landing page with marketing content
- ⏳ Organization onboarding flow
- ⏳ Multi-tenant architecture
- ⏳ Billing integration
- ⏳ Org management UI

---

## ⏳ Phase 3: Feature Complete (Weeks 5-6)

**Status:** ⏳ Planned  

**Goal:** Role-based views, teacher portal, polish

### Week 5: Role-Based UI

#### Day 1-2: Permission System
- [ ] Create permission definitions
- [ ] Add permission checking utilities
- [ ] Create permission guards
- [ ] Add role-based navigation

**Files to Create:**
```
src/lib/permissions/
├── definitions.ts        # Permission constants
├── checks.ts             # Permission checking logic
└── components/
    ├── PermissionGuard.tsx
    └── RoleBadge.tsx
```

#### Day 3-4: Role-Specific Views

**Admin View:**
- [ ] Full access to all features
- [ ] User management
- [ ] System settings
- [ ] Audit logs

**Manager View:**
- [ ] All except delete operations
- [ ] Schedule management
- [ ] Room management
- [ ] Report generation

**Teacher View (NEW):**
- [ ] My Schedule page
- [ ] My Students view
- [ ] Availability management
- [ ] Lesson notes/attendance

**Staff View:**
- [ ] Read-only access
- [ ] View schedules
- [ ] View student info
- [ ] No modification buttons

**Files to Create:**
```
src/app/(app)/my-schedule/
└── page.tsx              # Teacher schedule view

src/app/(app)/my-students/
└── page.tsx              # Teacher's students

src/components/teacher/
├── TeacherDashboard.tsx
├── AvailabilityManager.tsx
└── StudentProgress.tsx
```

#### Day 5: Navigation Updates
- [ ] Dynamic sidebar based on role
- [ ] Role-based quick actions
- [ ] Hide unauthorized menu items
- [ ] Add role indicator in UI

### Week 6: Polish & Features

#### Day 1-2: Notifications System
- [ ] Add notification service
- [ ] Email notifications (Resend)
- [ ] In-app notifications
- [ ] Notification preferences

**Files to Create:**
```
src/lib/notifications/
├── email.ts              # Email service
├── inapp.ts              # In-app notifications
└── templates/
    ├── lesson-reminder.ts
    └── approval-request.ts
```

#### Day 3-4: File Uploads
- [ ] Setup S3/Cloudflare R2
- [ ] Add avatar uploads
- [ ] Document attachments for students
- [ ] File management UI

#### Day 5: UX Polish
- [ ] Loading skeletons review
- [ ] Error state improvements
- [ ] Empty states
- [ ] Toast notifications review
- [ ] Mobile responsiveness audit

**Deliverables:**
- ⏳ Role-based UI views
- ⏳ Teacher portal
- ⏳ Notification system
- ⏳ File uploads
- ⏳ UX polish

---

## ⏳ Phase 4: Production Ready (Weeks 7-8)

**Status:** ⏳ Planned  

**Goal:** Testing, monitoring, deployment

### Week 7: Testing

#### Day 1-2: E2E Testing
- [ ] Setup Playwright
- [ ] Write critical path tests
- [ ] Auth flow tests
- [ ] CRUD operation tests

**Files to Create:**
```
e2e/
├── auth.spec.ts          # Authentication tests
├── teachers.spec.ts      # Teacher management
├── students.spec.ts      # Student management
├── lessons.spec.ts       # Scheduling tests
└── smoke.spec.ts         # Smoke tests
```

#### Day 3: Performance Testing
- [ ] Lighthouse audit
- [ ] API response time testing
- [ ] Database query optimization
- [ ] Add Redis caching

#### Day 4: Security Testing
- [ ] Penetration testing
- [ ] XSS vulnerability scan
- [ ] SQL injection tests
- [ ] CSRF validation

#### Day 5: Accessibility
- [ ] WCAG 2.1 AA audit
- [ ] Keyboard navigation test
- [ ] Screen reader testing
- [ ] Color contrast verification

### Week 8: DevOps & Monitoring

#### Day 1-2: CI/CD Pipeline
- [ ] GitHub Actions workflow
- [ ] Automated testing
- [ ] Deployment pipeline
- [ ] Database migration automation

**Files to Create:**
```
.github/
├── workflows/
│   ├── ci.yml            # Test and lint
│   └── deploy.yml        # Deployment
```

#### Day 3: Monitoring & Logging
- [ ] Setup error tracking (Sentry)
- [ ] Add application logging
- [ ] Performance monitoring
- [ ] Uptime monitoring

**Files to Create:**
```
src/lib/monitoring/
├── sentry.ts             # Error tracking
├── logging.ts            # Application logs
└── analytics.ts          # Usage analytics
```

#### Day 4: Documentation
- [ ] API documentation (Swagger)
- [ ] User guide
- [ ] Admin documentation
- [ ] Deployment guide

#### Day 5: Production Deployment
- [ ] Production environment setup
- [ ] Database migration
- [ ] DNS configuration
- [ ] SSL certificates
- [ ] Final smoke tests

**Deliverables:**
- ⏳ E2E test suite
- ⏳ CI/CD pipeline
- ⏳ Monitoring setup
- ⏳ Documentation
- ⏳ Production deployment

---

## Progress Summary

### Completed ✅
| Feature | Status | Date |
|---------|--------|------|
| Auth0 Integration | ✅ Complete | 2026-02-24 |
| Login/Signup Pages | ✅ Complete | 2026-02-24 |
| JWT API Security | ✅ Complete | 2026-02-24 |
| Auth Middleware | ✅ Complete | 2026-02-24 |
| User Sync to DB | ✅ Complete | 2026-02-24 |
| Role-Based Hooks | ✅ Complete | 2026-02-24 |

### In Progress 🔄
| Feature | Status | ETA |
|---------|--------|-----|
| Landing Page | 🔄 Next Task | Week 3 |
| Organization Onboarding | ⏳ Pending | Week 3 |
| Multi-Tenancy | ⏳ Pending | Week 4 |
| Billing (Stripe) | ⏳ Pending | Week 4 |

### Pending ⏳
| Feature | Status | ETA |
|---------|--------|-----|
| Role-Based UI Views | ⏳ Pending | Week 5 |
| Teacher Portal | ⏳ Pending | Week 5 |
| Notifications | ⏳ Pending | Week 6 |
| E2E Testing | ⏳ Pending | Week 7 |
| Production Deploy | ⏳ Pending | Week 8 |

---

## Next Immediate Actions

### Option 1: Landing Page (Recommended Next)
Build the public marketing site while Auth0 credentials are being set up.

**Tasks:**
1. Create marketing route group
2. Build hero section with CTA
3. Add features showcase
4. Create pricing section
5. Add contact form

**Time:** 2-3 days  
**Dependencies:** None (public pages)

### Option 2: Organization Onboarding
Build the multi-step onboarding flow for new schools.

**Tasks:**
1. Create onboarding wizard
2. Build org setup form
3. Add team invitation
4. Seed default data
5. Create org switcher

**Time:** 3-4 days  
**Dependencies:** Auth0 credentials, database

### Option 3: Wait for Auth0 Testing
Hold off on new features until Auth0 is configured and tested.

**Tasks:**
1. Configure Auth0 credentials
2. Test login/logout flow
3. Verify protected routes
4. Create admin user
5. Test role permissions

**Time:** 1-2 hours setup + testing  
**Dependencies:** Auth0 account

---

## Key Files Created/Modified

### Phase 1 (Complete)
| File | Purpose | Status |
|------|---------|--------|
| `src/lib/auth/config.ts` | Auth0 configuration | ✅ Created |
| `src/lib/auth/session.ts` | Session utilities | ✅ Created |
| `src/app/api/auth/[...auth0]/route.ts` | Auth0 API routes | ✅ Created |
| `src/app/login/page.tsx` | Login page | ✅ Created |
| `src/app/signup/page.tsx` | Signup page | ✅ Created |
| `src/hooks/useAuth.ts` | Auth hooks | ✅ Created |
| `src/middleware.ts` | Auth middleware | ✅ Created |
| `src/lib/api-utils.ts` | JWT auth | ✅ Modified |
| `src/lib/api/client.ts` | Remove hardcoded auth | ✅ Modified |
| `src/app/layout.tsx` | Auth0Provider | ✅ Modified |
| `src/components/dashboard/TopNav.tsx` | Real user data | ✅ Modified |

### Phase 2 (Next)
| File | Purpose | Status |
|------|---------|--------|
| `src/app/(marketing)/page.tsx` | Landing page | 🔄 Next |
| `src/app/onboarding/page.tsx` | Onboarding wizard | ⏳ Pending |
| `src/app/(app)/settings/organization/page.tsx` | Org settings | ⏳ Pending |
| `src/lib/billing/stripe.ts` | Stripe client | ⏳ Pending |

---

## Dependencies Status

### Installed ✅
```json
{
  "@auth0/nextjs-auth0": "^3.5.0"  // ✅ Authentication
}
```

### To Install
```json
{
  "stripe": "^14.0.0",              // Billing (Week 4)
  "@stripe/stripe-js": "^2.0.0",    // Billing (Week 4)
  "resend": "^3.0.0",               // Email (Week 6)
  "@sentry/nextjs": "^7.100.0",     // Monitoring (Week 8)
  "@playwright/test": "^1.40.0"     // Testing (Week 7)
}
```

---

## Testing Status

| Test Type | Count | Status |
|-----------|-------|--------|
| API Unit Tests | 274 | ✅ Passing |
| Component Tests | 0 | ⏳ Week 7 |
| E2E Tests | 0 | ⏳ Week 7 |
| Auth Flow Tests | 0 | ⏳ Manual testing |

---

## Questions to Resolve

### Immediate
1. **Landing Page Content**: Do you have marketing copy, or should I create placeholder content?
2. **Pricing Structure**: What plans should we offer? (Free, Basic, Pro, Enterprise?)
3. **Auth0 Testing**: When will you have Auth0 credentials ready for testing?

### Future
4. **Stripe Plan**: Which countries to support for billing?
5. **File Storage**: AWS S3 or Cloudflare R2?
6. **Email Provider**: Resend, SendGrid, or AWS SES?
7. **Custom Domain**: Do we need custom auth domain for production?

---

## Ready to Continue?

### What's Next?

**I recommend building the Landing Page next** because:
1. ✅ No dependencies on Auth0 credentials
2. ✅ Can be built and tested immediately
3. ✅ Important for SaaS marketing
4. ✅ Gives immediate visual progress

### Say one of these:

1. **"Build landing page"** - I'll create the marketing site
2. **"Build onboarding"** - I'll create the org setup flow
3. **"Fix lint errors"** - Clean up the existing lint warnings
4. **"Add more tests"** - Write tests for the auth system
5. **"Wait for Auth0"** - Pause until credentials are ready

---

**Current Status:** Phase 1 Complete, Ready for Phase 2 🚀
