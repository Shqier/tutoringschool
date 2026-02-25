# Busala SaaS Development Roadmap

**Version:** 1.0 → SaaS MVP  
**Timeline:** 8 Weeks to Production  
**Branch:** `kimi-code`  

---

## Phase Overview

```
Week 1-2:  Foundation (Auth + Security)
Week 3-4:  SaaS Core (Landing + Tenancy)
Week 5-6:  Feature Complete (RBAC + Polish)
Week 7-8:  Production Ready (Testing + DevOps)
```

---

## Phase 1: Foundation (Weeks 1-2)
**Goal:** Secure authentication, remove security vulnerabilities

### Week 1: Authentication Implementation

#### Day 1-2: Auth0 Setup
- [ ] Install Auth0 SDK: `npm install @auth0/nextjs-auth0`
- [ ] Create Auth0 account and application
- [ ] Configure environment variables
- [ ] Create auth configuration file

**Files to Create:**
```
src/lib/auth/
├── auth0.ts              # Auth0 client configuration
├── middleware.ts         # Auth middleware
└── session.ts            # Session management

src/app/api/auth/
├── [...auth0]/
│   └── route.ts          # Auth0 API routes
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

#### Day 3-4: Login/Logout Pages
- [ ] Create login page (`/login`)
- [ ] Create signup page (`/signup`)
- [ ] Add Auth0Provider to layout
- [ ] Create auth hooks (`useAuth`, `useUser`)
- [ ] Update `getUserFromRequest()` to use JWT

**Files to Create:**
```
src/app/login/
├── page.tsx              # Login page with Auth0
└── layout.tsx            # Login layout

src/app/signup/
└── page.tsx              # Signup/Register page

src/hooks/
├── useAuth.ts            # Authentication hook
└── usePermissions.ts     # Role permission hook
```

#### Day 5: Secure API Routes
- [ ] Remove header-based authentication
- [ ] Add JWT validation middleware
- [ ] Update all API routes to use real auth
- [ ] Add CSRF protection
- [ ] Add rate limiting

**Files to Modify:**
```
src/lib/api-utils.ts      # Remove header auth, add JWT
src/app/api/*/route.ts    # All API routes
src/middleware.ts         # Global middleware NEW
```

### Week 2: Security & Session Management

#### Day 1-2: Session Management
- [ ] Implement session persistence
- [ ] Add session refresh logic
- [ ] Handle token expiration
- [ ] Add "Remember me" functionality

#### Day 3-4: Role Synchronization
- [ ] Sync Auth0 roles with database
- [ ] Create user sync webhook
- [ ] Handle role changes
- [ ] Add role assignment UI (admin only)

**Files to Create:**
```
src/app/api/webhooks/
└── auth0.ts              # Auth0 webhook handler

src/lib/auth/
└── sync.ts               # User sync utilities
```

#### Day 5: Security Audit
- [ ] Remove all hardcoded auth
- [ ] Add security headers
- [ ] Verify CORS configuration
- [ ] Test all protected routes
- [ ] Run security scan (npm audit)

**Deliverables:**
- ✅ Secure authentication flow
- ✅ JWT-based API protection
- ✅ Login/signup pages
- ✅ Session management
- ✅ Security audit passed

---

## Phase 2: SaaS Core (Weeks 3-4)
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
- ✅ Landing page with marketing content
- ✅ Organization onboarding flow
- ✅ Multi-tenant architecture
- ✅ Billing integration
- ✅ Org management UI

---

## Phase 3: Feature Complete (Weeks 5-6)
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
- ✅ Role-based UI views
- ✅ Teacher portal
- ✅ Notification system
- ✅ File uploads
- ✅ UX polish

---

## Phase 4: Production Ready (Weeks 7-8)
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
- ✅ E2E test suite
- ✅ CI/CD pipeline
- ✅ Monitoring setup
- ✅ Documentation
- ✅ Production deployment

---

## Implementation Order

### Immediate (This Week)
```
Priority 1: Auth0 Integration
├── Install SDK
├── Configure environment
├── Create login page
└── Secure API routes

Priority 2: Remove Security Holes
├── Remove header auth
├── Add JWT validation
└── Audit all routes
```

### Short Term (Next 2 Weeks)
```
Priority 3: Landing Page
├── Design and content
├── Signup flow
└── Marketing integration

Priority 4: Multi-Tenancy
├── Org onboarding
├── Billing (Stripe)
└── Tenant isolation
```

### Medium Term (Next 4 Weeks)
```
Priority 5: Role-Based Views
├── Teacher portal
├── Permission system
└── Dynamic navigation

Priority 6: Production Polish
├── E2E tests
├── Monitoring
└── Documentation
```

---

## Key Files to Modify

### High Impact
| File | Changes |
|------|---------|
| `src/lib/api-utils.ts` | Remove header auth, add JWT |
| `src/lib/api/client.ts` | Add token management |
| `src/app/layout.tsx` | Add Auth0Provider |
| `src/app/page.tsx` | Create landing page |
| `src/middleware.ts` | Add auth middleware NEW |

### Medium Impact
| File | Changes |
|------|---------|
| `src/components/dashboard/TopNav.tsx` | Add user menu, logout |
| `src/components/dashboard/SidebarNav.tsx` | Role-based items |
| `prisma/schema.prisma` | Add auth fields |
| `src/app/(app)/*/page.tsx` | Add permission guards |

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@auth0/nextjs-auth0": "^3.5.0",
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^2.0.0",
    "resend": "^3.0.0",
    "@sentry/nextjs": "^7.100.0",
    "redis": "^4.6.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "lighthouse": "^11.0.0"
  }
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Test Coverage | >80% |
| Lighthouse Score | >90 |
| API Response Time | <200ms |
| Auth Flow Success | 99.9% |
| Uptime | 99.9% |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Auth0 downtime | Implement refresh token fallback |
| Data migration issues | Test migrations on staging |
| Performance degradation | Add caching layers |
| Security vulnerabilities | Regular dependency audits |
| User adoption | Beta testing program |

---

## Next Actions (Start Now)

1. **Create Auth0 account** - 15 minutes
2. **Install Auth0 SDK** - 5 minutes  
3. **Create environment file** - 10 minutes
4. **Update `.env.example`** - 5 minutes
5. **Create auth config file** - 30 minutes

**Total Time to Start:** ~1 hour

---

## Questions to Resolve

1. **Auth0 Plan**: Free tier (7,500 users) or paid?
2. **Custom Domain**: Do we need custom auth domain?
3. **Stripe Plan**: Which countries to support?
4. **File Storage**: AWS S3 or Cloudflare R2?
5. **Email Provider**: Resend, SendGrid, or AWS SES?

---

**Ready to start Phase 1?** 

Let me know which phase you'd like to begin with, and I'll start implementing immediately.
