# BUSALA — MASTER BUILD PROMPT
### The Complete, Copy-Ready Blueprint for Building a Multi-Tenant SaaS Scheduling Intelligence Platform

---

> **How to use this document:** This is your single source of truth. Each section is a self-contained prompt you paste to your AI coding assistant (Cursor, Claude, ChatGPT, etc.) at the right stage of development. Follow the order. Never skip a section. Each section builds on the previous one.

---

## ═══════════════════════════════════════════
## SECTION 0 — MASTER CONTEXT (Paste this at the start of EVERY new conversation)
## ═══════════════════════════════════════════

```
You are building BUSALA — a premium multi-tenant B2B SaaS platform for operational 
scheduling intelligence, initially targeting private schools, tutoring centers, 
and educational institutes. The platform has two layers:

LAYER 1 — SUPER ADMIN (Platform CRM)
  - Busala's own back-office
  - Manages all tenants (organizations) from one place
  - Onboards new tenants, sets plans, monitors usage, handles billing
  - Full visibility across all tenants without seeing their private data

LAYER 2 — TENANT WORKSPACE
  - Each tenant (e.g., a private school) gets their own isolated workspace
  - Tenants manage their own resources: teachers, students, groups, rooms, schedules
  - Tenants cannot see other tenants' data — ever
  - Each tenant can have multiple roles: Owner, Admin, Coordinator, Teacher

TECH STACK (non-negotiable):
  - Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
  - Backend: Next.js API Routes (or NestJS for complex services)
  - Database: PostgreSQL + Prisma ORM
  - Auth: NextAuth.js v5 (Auth.js) with JWT sessions
  - Multi-tenancy: Shared database, schema-per-tenant with Row-Level Security (RLS)
  - Tenant routing: Subdomain-based (tenant.busala.com) + path-based fallback
  - Payments: Stripe (subscriptions + usage metering)
  - Email: Resend (transactional) + React Email (templates)
  - File Storage: Cloudflare R2 or AWS S3
  - Caching: Redis (Upstash for serverless)
  - Deployment: Vercel (frontend) + Railway or Supabase (Postgres) 
  - Testing: Vitest (unit) + Playwright (E2E)

DEVELOPMENT PHILOSOPHY:
  - Vertical Slice Architecture: each feature is complete (DB → API → UI → Tests) 
    before moving to the next
  - TypeScript strict mode everywhere
  - API-first: build and test the API before building the UI
  - Every model includes tenantId for automatic tenant scoping
  - No fake UI progress — every screen must connect to real data

CURRENT VERTICAL SLICES (in order):
  1. Foundation & Auth (this session)
  2. Tenant Onboarding & CRM
  3. Lessons Engine
  4. Teachers & Availability
  5. Groups & Students
  6. Scheduling Intelligence & Conflict Detection
  7. Resource Management (Rooms, Time Slots)
  8. Analytics & Reporting
  9. Billing & Plans
  10. Notifications & Automation

Always write production-grade code. Always add JSDoc comments on services. 
Always handle errors explicitly. Never use `any` in TypeScript.
```

---

## ═══════════════════════════════════════════
## SECTION 1 — PROJECT FOUNDATION & ARCHITECTURE
## ═══════════════════════════════════════════

### PROMPT 1.1 — Project Scaffolding

```
Using the master context above, scaffold the complete Busala monorepo project structure.

Create the following directory structure and explain every folder's purpose:

busala/
├── apps/
│   ├── web/                     # Next.js 14 frontend (App Router)
│   │   ├── app/
│   │   │   ├── (marketing)/     # Public landing pages
│   │   │   ├── (auth)/          # Login, register, forgot password
│   │   │   ├── (superadmin)/    # Super admin CRM portal
│   │   │   │   ├── dashboard/
│   │   │   │   ├── tenants/
│   │   │   │   ├── billing/
│   │   │   │   └── settings/
│   │   │   ├── (tenant)/        # Tenant workspace (subdomain-routed)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── lessons/
│   │   │   │   ├── teachers/
│   │   │   │   ├── students/
│   │   │   │   ├── groups/
│   │   │   │   ├── schedule/
│   │   │   │   └── settings/
│   │   │   └── api/             # Next.js API routes
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── superadmin/      # Super admin specific components
│   │   │   ├── tenant/          # Tenant workspace components
│   │   │   └── shared/          # Shared across both layers
│   │   ├── lib/
│   │   │   ├── auth.ts          # NextAuth config
│   │   │   ├── db.ts            # Prisma client singleton
│   │   │   ├── tenant.ts        # Tenant resolution middleware
│   │   │   ├── stripe.ts        # Stripe client
│   │   │   └── redis.ts         # Redis/Upstash client
│   │   └── middleware.ts         # Subdomain routing + auth guards
│   └── docs/                    # Internal documentation site (optional)
├── packages/
│   ├── database/                # Shared Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   ├── types/                   # Shared TypeScript types/interfaces
│   ├── validators/              # Zod schemas (shared between FE & BE)
│   └── config/                  # Shared constants, enums, plan configs
├── .env.example
├── turbo.json                   # Turborepo config
└── package.json

Then generate:
1. The root package.json with Turborepo setup
2. The apps/web/package.json with all dependencies
3. The turbo.json pipeline config
4. The .env.example with every required environment variable
5. The tsconfig.json with strict mode enabled

Dependencies to install:
next@14, react@18, typescript, tailwindcss, @prisma/client, prisma,
next-auth@beta, @auth/prisma-adapter, stripe, @stripe/stripe-js,
resend, react-email, zod, zustand, @tanstack/react-query, 
date-fns, ioredis, @upstash/redis, lucide-react, recharts,
@radix-ui/react-* (full shadcn set), clsx, tailwind-merge,
vitest, @playwright/test, @testing-library/react
```

---

### PROMPT 1.2 — Database Schema (Complete Prisma Schema)

```
Using the master context, write the COMPLETE Prisma schema for Busala.
This schema must cover ALL domains. Do not skip any model.

Requirements:
- Every tenant-scoped model MUST have: tenantId String, createdAt, updatedAt
- Use cuid() for all IDs
- Use proper PostgreSQL-native types where applicable
- Add @@index on every foreign key and on tenantId + common filter fields
- Add @@unique constraints where business logic requires it

Write ALL of these models with full fields and relations:

═══ PLATFORM LAYER (Super Admin) ═══

model Plan {
  // Pricing plans: Starter, Growth, Enterprise
  // Fields: id, name, slug, description, maxTeachers, maxStudents, 
  //         maxGroups, maxRooms, priceMonthly, priceAnnual, 
  //         features (Json), isActive, isCustom
}

model Tenant {
  // An organization using Busala (e.g., "Cairo Private Academy")
  // Fields: id, name, slug (unique), subdomain (unique), 
  //         email, phone, logoUrl, address, country, timezone,
  //         planId, stripeCustomerId, stripeSubscriptionId,
  //         subscriptionStatus (enum), trialEndsAt, isActive,
  //         onboardingCompletedAt, settings (Json), createdAt, updatedAt
  // Relations: plan, users, subscription history
}

model TenantSubscriptionHistory {
  // Audit log of all plan changes
}

model SuperAdminUser {
  // Internal Busala team accounts — completely separate from tenant users
  // Fields: id, email, hashedPassword, name, role (enum: OWNER/ADMIN/SUPPORT), 
  //         lastLoginAt, isActive
}

model PlatformAuditLog {
  // Track all super admin actions
}

═══ AUTH & USER LAYER ═══

model User {
  // Users belonging to a tenant
  // Fields: id, tenantId, email, hashedPassword, name, avatarUrl,
  //         role (enum: OWNER/ADMIN/COORDINATOR/TEACHER/VIEWER),
  //         isActive, emailVerifiedAt, lastLoginAt, invitedBy,
  //         createdAt, updatedAt
  // Relations: tenant, teacherProfile, sessions
}

model UserInvitation {
  // Pending invitations sent to join a tenant workspace
  // Fields: id, tenantId, email, role, token (unique), 
  //         expiresAt, acceptedAt, invitedByUserId
}

model Session {
  // NextAuth sessions
}

═══ CORE SCHEDULING DOMAIN ═══

model Teacher {
  // A teacher profile linked to a user account
  // Fields: id, tenantId, userId (nullable — can pre-create without account),
  //         name, email, phone, specializations (String[]), 
  //         color (hex for calendar display), maxWeeklyHours,
  //         isActive, notes, createdAt, updatedAt
  // Relations: tenant, user, availability, lessons, groupTeachers
}

model TeacherAvailability {
  // Recurring weekly availability windows
  // Fields: id, tenantId, teacherId, dayOfWeek (0-6), 
  //         startTime (String "HH:MM"), endTime (String "HH:MM"),
  //         isRecurring, effectiveFrom, effectiveTo, notes
}

model TeacherAvailabilityException {
  // One-off overrides: a day off, special availability
  // Fields: id, tenantId, teacherId, date, type (UNAVAILABLE/AVAILABLE),
  //         startTime, endTime, reason
}

model Student {
  // A student enrolled in the institution
  // Fields: id, tenantId, name, email, phone, parentPhone,
  //         dateOfBirth, grade, notes, isActive, 
  //         enrolledAt, createdAt, updatedAt
  // Relations: tenant, groupMemberships, lessonAttendances
}

model Group {
  // A class/cohort of students
  // Fields: id, tenantId, name, description, subject, level,
  //         maxCapacity, color (hex), isActive, 
  //         academicYear, semester, createdAt, updatedAt
  // Relations: tenant, members (students), lessons, teachers
}

model GroupStudent {
  // Many-to-many: students in groups
  // Fields: id, tenantId, groupId, studentId, 
  //         joinedAt, leftAt, status (ACTIVE/INACTIVE)
}

model GroupTeacher {
  // Many-to-many: teachers assigned to groups
  // Fields: id, tenantId, groupId, teacherId, 
  //         role (PRIMARY/ASSISTANT), assignedAt
}

model Room {
  // Physical or virtual rooms/locations
  // Fields: id, tenantId, name, capacity, type (enum: CLASSROOM/LAB/ONLINE/OTHER),
  //         floor, building, equipment (String[]), 
  //         isActive, notes, createdAt, updatedAt
}

model Lesson {
  // The core scheduling unit — a single class session
  // Fields: id, tenantId, title, teacherId, groupId (nullable),
  //         roomId (nullable), subject, type (enum: REGULAR/MAKEUP/EXAM/TRIAL),
  //         status (enum: SCHEDULED/CONFIRMED/CANCELLED/COMPLETED/CONFLICT),
  //         startTime (DateTime), endTime (DateTime), durationMinutes,
  //         isRecurring, recurringPatternId (nullable),
  //         conflictOverriddenBy (userId, nullable),
  //         conflictOverrideReason (nullable),
  //         notes, color, createdAt, updatedAt
  // Relations: teacher, group, room, attendances, recurringPattern, conflicts
}

model RecurringPattern {
  // Defines repeating lesson rules (weekly, biweekly, etc.)
  // Fields: id, tenantId, teacherId, groupId, roomId,
  //         subject, durationMinutes, startTime (String "HH:MM"),
  //         dayOfWeek (Int[]), frequency (enum: WEEKLY/BIWEEKLY/MONTHLY),
  //         recurrenceStart, recurrenceEnd, isActive,
  //         generatedUntil (last date lessons were auto-generated)
}

model LessonConflict {
  // Records detected conflicts for audit and UX
  // Fields: id, tenantId, lessonId, conflictType 
  //         (enum: TEACHER_DOUBLE_BOOKED/ROOM_DOUBLE_BOOKED/
  //                TEACHER_UNAVAILABLE/STUDENT_OVERLAP),
  //         conflictingLessonId, detectedAt, resolvedAt,
  //         resolvedBy, resolution (enum: OVERRIDE/RESCHEDULE/CANCEL)
}

model LessonAttendance {
  // Per-student attendance per lesson
  // Fields: id, tenantId, lessonId, studentId, 
  //         status (enum: PRESENT/ABSENT/LATE/EXCUSED),
  //         markedAt, markedBy, notes
}

═══ BILLING & USAGE ═══

model UsageRecord {
  // Track monthly usage per tenant for metered billing
  // Fields: id, tenantId, period (String "YYYY-MM"), 
  //         teacherCount, studentCount, lessonCount,
  //         groupCount, storageBytes, recordedAt
}

model Invoice {
  // Mirror of Stripe invoices for in-app display
  // Fields: id, tenantId, stripeInvoiceId, amount, currency,
  //         status, periodStart, periodEnd, paidAt, invoicePdf
}

═══ NOTIFICATIONS & AUDIT ═══

model Notification {
  // In-app notifications for users
  // Fields: id, tenantId, userId, type, title, body, 
  //         data (Json), readAt, createdAt
}

model TenantAuditLog {
  // Track all significant actions within a tenant
  // Fields: id, tenantId, userId, action (String), 
  //         entityType, entityId, before (Json), after (Json),
  //         ipAddress, userAgent, createdAt
}

After writing the schema:
1. Write the PostgreSQL RLS policies for tenant isolation
2. Write the Prisma seed file with: 2 plans, 2 demo tenants, sample data for each
3. Write the migration command sequence
```

---

### PROMPT 1.3 — Multi-Tenant Middleware & Auth

```
Using the master context and the Prisma schema from Section 1.2, build the 
complete authentication and tenant routing system.

Build these files completely with full production code:

━━━ 1. apps/web/middleware.ts ━━━
Purpose: Intercept all requests, resolve tenant from subdomain, protect routes.

Logic:
- Extract subdomain from hostname (e.g., "cairo-academy" from "cairo-academy.busala.com")
- Look up tenant in DB by subdomain
- Inject tenant context into request headers (x-tenant-id, x-tenant-slug)
- Route /superadmin/* — require SuperAdminUser session
- Route /app/* (tenant workspace) — require User session matching the tenant
- Route /auth/* — always public
- Route / (marketing) — always public
- Redirect unauthenticated users to correct login page based on route

━━━ 2. lib/auth.ts ━━━
Purpose: NextAuth v5 configuration.

Configure TWO separate authentication flows:
A) SuperAdmin auth — email/password against SuperAdminUser table
B) Tenant User auth — email/password against User table, scoped to tenant

Include:
- Credentials provider for both flows
- JWT callbacks that embed: userId, role, tenantId, isSuperAdmin
- Session callbacks that expose safe session data to client
- Proper error handling for invalid credentials

━━━ 3. lib/tenant.ts ━━━
Purpose: Tenant context utilities used throughout the app.

Functions to write:
- getTenantFromHeaders(headers): Tenant | null
- getTenantFromSubdomain(subdomain: string): Promise<Tenant | null>
- requireTenant(headers): Tenant (throws if missing)
- getPrismaForTenant(tenantId): PrismaClient with tenant middleware applied

━━━ 4. lib/db.ts ━━━
Purpose: Prisma singleton with tenant-scoping middleware.

- Global Prisma client singleton (safe for Next.js hot reload)
- Prisma middleware that automatically appends tenantId to all queries 
  on tenant-scoped models when tenantId context is available
- Logging in development

━━━ 5. app/(auth)/login/page.tsx ━━━
Complete login page UI with:
- Auto-detect if on superadmin domain or tenant subdomain
- Show appropriate form (superadmin login vs tenant login)
- Form validation with Zod + react-hook-form
- Error states, loading states
- "Forgot password" link

━━━ 6. app/(auth)/register/page.tsx ━━━
Tenant signup page (public — any school can sign up):
- Fields: Organization Name, Your Name, Email, Password, Phone
- After submit: create Tenant + Owner User + send welcome email
- Redirect to onboarding flow

Write full, production-ready TypeScript code for all files above.
```

---

## ═══════════════════════════════════════════
## SECTION 2 — SUPER ADMIN CRM (Platform Layer)
## ═══════════════════════════════════════════

### PROMPT 2.1 — Super Admin Dashboard & Tenant List

```
Using the master context, build the complete Super Admin CRM portal.
This is Busala's internal back-office for managing all tenant organizations.

Design direction: 
- Dark theme (#0F1117 background)
- Gold accent (#C9A84C) for primary actions
- Clean data-dense tables, not card-heavy
- Professional, institutional — think Linear meets Stripe Dashboard

━━━ Build these pages completely ━━━

1. /superadmin/dashboard — Overview page
   Metrics cards (real data from DB):
   - Total tenants (active / trial / churned)
   - MRR (Monthly Recurring Revenue)  
   - Total teachers across all tenants
   - Total lessons scheduled this month
   - New signups this week
   - Tenants nearing plan limits (warning list)
   
   Charts (using Recharts):
   - Tenant growth over time (line chart)
   - Revenue by plan tier (bar chart)
   - Lesson volume heatmap by day
   
   Recent activity feed (last 20 tenant actions)

2. /superadmin/tenants — Tenant management list
   Table with columns:
   - Organization name + logo
   - Plan (with badge color)
   - Status (Active/Trial/Suspended/Churned) with badge
   - Teachers count / Students count / Lessons this month
   - Trial ends / Renewal date
   - Created date
   - Actions: View, Impersonate, Suspend, Delete

   Features:
   - Search by name/email/subdomain
   - Filter by plan, status, country
   - Sort by any column
   - Pagination (50 per page)
   - Bulk actions: send email, change plan, export CSV

3. /superadmin/tenants/[id] — Tenant detail page
   Tabs:
   ├── Overview: metrics, health score, timeline
   ├── Users: list all users in this tenant with roles
   ├── Usage: teachers/students/lessons/rooms counts + charts
   ├── Billing: plan, invoices, payment method, Stripe link
   ├── Settings: edit name, subdomain, plan, suspension
   └── Audit Log: all actions taken in this tenant

4. /superadmin/tenants/new — Create new tenant form
   Fields: Organization name, subdomain, owner email, owner name, 
   plan selection, send welcome email toggle

5. /superadmin/plans — Plan management
   Table of all plans with pricing
   Ability to create/edit plans with feature toggles
   See how many tenants are on each plan

━━━ API Routes to build ━━━
GET  /api/superadmin/metrics          — dashboard stats
GET  /api/superadmin/tenants          — paginated tenant list
POST /api/superadmin/tenants          — create tenant
GET  /api/superadmin/tenants/[id]     — tenant detail
PUT  /api/superadmin/tenants/[id]     — update tenant
POST /api/superadmin/tenants/[id]/suspend    — suspend tenant
POST /api/superadmin/tenants/[id]/impersonate — generate impersonation token
GET  /api/superadmin/plans            — list plans
POST /api/superadmin/plans            — create plan
PUT  /api/superadmin/plans/[id]       — update plan

For each API route:
- Verify super admin session
- Validate input with Zod
- Handle all error cases
- Return consistent response shape: { data, error, meta }

Write the complete code for all pages and API routes.
```

---

### PROMPT 2.2 — Tenant Onboarding Flow

```
Using the master context, build the tenant onboarding wizard that runs 
immediately after a new tenant registers.

This is critical for activation — it must be smooth, fast, and delightful.

━━━ Onboarding Steps (multi-step wizard) ━━━

Step 1: Welcome & Organization Setup
- Confirm organization name
- Upload logo (with Cloudflare R2 upload)
- Set timezone (searchable dropdown with all timezones)
- Set academic year format (Sept-June / Jan-Dec / custom)
- Set working days (Mon-Fri / Sat included / etc.)
- Set default lesson duration (45min / 60min / 90min / custom)

Step 2: Add Your First Teachers
- Add up to 3 teachers (name, email, subjects)
- Option to "Skip for now"
- Show: "You can add more teachers later"

Step 3: Add Your First Students  
- Add up to 5 students (name, grade/level)
- Option to "Skip for now"

Step 4: Create Your First Group
- Group name, subject, select teacher(s), select students
- Option to "Skip for now"

Step 5: Schedule Your First Lesson
- Pick teacher, group, date, time, room (optional)
- Shows instant conflict preview
- Option to "Skip for now"

Step 6: Done! 
- Celebration animation
- Summary of what was set up
- Quick-start guide links
- "Go to Dashboard" CTA

━━━ Requirements ━━━
- Progress indicator at top (step X of 6)
- Each step validates before proceeding
- All data is saved progressively (no losing work on refresh)
- Can skip any step after step 1
- Track onboardingCompletedAt on Tenant model when finished
- Show onboarding prompt on dashboard if not completed

Write full UI components + API routes for each onboarding step.
```

---

## ═══════════════════════════════════════════
## SECTION 3 — TENANT WORKSPACE (Core Product)
## ═══════════════════════════════════════════

### PROMPT 3.1 — Tenant Layout & Navigation

```
Using the master context, build the complete tenant workspace shell — 
the layout that wraps all tenant pages.

Design direction:
- Dark navy sidebar (#0D1321) 
- Premium academic feel — think "Notion + Linear for schools"
- Dense but breathable — information-rich without feeling cluttered
- Gold (#C9A84C) as primary brand accent
- Status colors: green (active), amber (warning), red (conflict/error)

━━━ Build these components ━━━

1. TopNav component
   - Left: Busala logo + org name + plan badge
   - Center: Global search (Cmd+K) — searches lessons, teachers, students
   - Right: Notifications bell (count badge) + User avatar dropdown
   User dropdown: Profile, Settings, Invite Team, Help, Logout

2. Sidebar component
   Navigation items with icons + labels + active state:
   ├── Dashboard (overview of everything)
   ├── Schedule (the main calendar view)
   ├── Lessons (lesson list + CRUD)
   ├── Teachers (teacher profiles + availability)
   ├── Students (student roster)
   ├── Groups (group management)
   ├── Rooms (room management)
   ├── Reports (analytics — Premium only)
   └── Settings (tenant settings, team, billing)
   
   Bottom of sidebar:
   - Plan usage bar (e.g., "18/25 teachers used")
   - "Upgrade Plan" CTA if near limit
   - Current user avatar + role

3. Dashboard page (/app/dashboard)
   Four summary cards: Active Teachers, Active Students, 
   Lessons This Week, Upcoming Conflicts (red if > 0)
   
   Today's Schedule: Timeline view of today's lessons with status
   Upcoming Lessons: Next 7 days list
   Recent Activity: Last 10 actions in the workspace
   Quick Actions: "Schedule Lesson", "Add Teacher", "New Group" buttons
   
   Alerts panel (if any):
   - Lessons with unresolved conflicts
   - Teachers with no availability set
   - Groups with no scheduled lessons this week

4. Global Command Palette (Cmd+K)
   Search across: teachers, students, groups, lessons
   Quick actions: "New Lesson", "New Teacher", "New Student"
   
5. Breadcrumb component (context-aware)

6. Page header component (title + description + action button)

Write all components with proper TypeScript props, Tailwind styling,
and connect real data via React Query.
```

---

### PROMPT 3.2 — Lessons Engine (Complete Vertical Slice)

```
Using the master context, build the COMPLETE Lessons vertical slice.
This is the core of Busala. It must be perfect.

━━━ DATABASE (already in schema — confirm these fields) ━━━
Lesson: id, tenantId, title, teacherId, groupId?, roomId?, subject,
type (REGULAR/MAKEUP/EXAM/TRIAL), status (SCHEDULED/CONFIRMED/CANCELLED/COMPLETED/CONFLICT),
startTime, endTime, durationMinutes, isRecurring, recurringPatternId?,
conflictOverriddenBy?, conflictOverrideReason?, notes, color, createdAt, updatedAt

━━━ CONFLICT DETECTION ENGINE (most important part) ━━━
Write a ConflictDetectionService class in /lib/conflicts.ts:

detectConflicts(lesson: LessonInput, excludeLessonId?: string): Promise<Conflict[]>

It must check ALL of these conflict types:
1. TEACHER_DOUBLE_BOOKED: teacher has another lesson at the same time
2. ROOM_DOUBLE_BOOKED: room is booked at the same time
3. TEACHER_UNAVAILABLE: lesson is outside teacher's availability windows
4. STUDENT_OVERLAP: a student in this group is in another group lesson at same time
5. TEACHER_EXCEPTION: teacher has an unavailability exception on this date

Return for each conflict: { type, severity (ERROR/WARNING), 
conflictingLessonId?, conflictingLesson?, message, canOverride }

Only TEACHER_DOUBLE_BOOKED and ROOM_DOUBLE_BOOKED are hard conflicts (cannot schedule).
Others are warnings that can be overridden with a reason.

━━━ API ROUTES ━━━

POST /api/lessons/check-conflicts
  Body: { teacherId, roomId?, groupId?, startTime, endTime, excludeLessonId? }
  Returns: { conflicts: Conflict[], canSchedule: boolean }
  (Call this on every form change — real-time conflict feedback)

GET  /api/lessons
  Query params: startDate, endDate, teacherId?, groupId?, roomId?, 
                status?, type?, search?, page, limit
  Returns: paginated lessons with teacher/group/room populated

POST /api/lessons
  Body: CreateLessonDto (Zod validated)
  Logic: 
    1. Validate input
    2. Run conflict detection
    3. If hard conflicts exist → 400 with conflict details
    4. If only warnings → create lesson with status SCHEDULED, log conflicts
    5. Create LessonConflict records if any
    6. Return created lesson

GET  /api/lessons/[id]
PUT  /api/lessons/[id]  (same conflict check on update)
DELETE /api/lessons/[id]  (soft delete — set status CANCELLED)

POST /api/lessons/[id]/override-conflict
  Body: { reason: string }
  Requires: ADMIN or COORDINATOR role
  Logic: Set conflictOverriddenBy, conflictOverrideReason, change status

POST /api/lessons/[id]/complete  (mark as completed)
POST /api/lessons/[id]/cancel    (cancel with reason)

POST /api/lessons/bulk-create    (for recurring patterns)
  Body: { pattern: RecurringPatternDto, generateWeeks: number }
  Logic: Generate N weeks of lessons, detect conflicts for each

━━━ UI PAGES ━━━

1. /app/lessons — Lesson List
   Toggle between: Table view / Calendar view (week/month)
   
   Table columns: Date/Time, Title, Teacher, Group, Room, 
                  Duration, Status (badge), Type (badge), Actions
   
   Filters bar: Date range picker, Teacher select, Group select, 
                Room select, Status multi-select, Type multi-select
   
   Each row has: Edit, Duplicate, Cancel, Mark Complete quick actions
   
   Conflicts shown inline: red row highlight + conflict icon + tooltip

2. /app/lessons/new — Create Lesson Form
   Fields:
   - Subject / Title
   - Teacher (searchable select — shows availability status)  
   - Group (searchable select — or "No Group" for private lessons)
   - Room (optional — shows availability)
   - Date picker
   - Start time / End time (or duration selector)
   - Type: Regular / Makeup / Exam / Trial
   - Recurring: toggle → show day of week + end date
   - Notes (optional)
   - Color picker (for calendar display)

   REAL-TIME CONFLICT PANEL (right side of form):
   - Shows conflict results as user fills the form
   - Green checkmark when no conflicts
   - Yellow warnings for overridable conflicts  
   - Red errors for hard conflicts (prevents submission)
   - Each conflict shows: what the conflict is, conflicting lesson link

   If warnings only: Show "Override with Reason" textarea + submit

3. /app/lessons/[id] — Lesson Detail
   Full lesson info, attendance tracking, conflict history, edit/cancel

━━━ TESTS ━━━
Write Vitest tests for ConflictDetectionService covering:
- No conflict scenario
- Teacher double booking
- Room double booking  
- Teacher unavailability
- Conflict override
- Recurring pattern conflicts
- Edge cases: same start/end time, back-to-back lessons

Write all code completely. The conflict detection engine is the heart 
of Busala — make it bulletproof.
```

---

### PROMPT 3.3 — Teachers & Availability (Vertical Slice)

```
Using the master context, build the complete Teachers vertical slice.

━━━ API ROUTES ━━━

GET  /api/teachers               — list all teachers (with search, filter by subject)
POST /api/teachers               — create teacher
GET  /api/teachers/[id]          — teacher detail with stats
PUT  /api/teachers/[id]          — update teacher
DELETE /api/teachers/[id]        — soft delete (isActive = false)

GET  /api/teachers/[id]/availability         — get availability windows
PUT  /api/teachers/[id]/availability         — set availability (replace all)
POST /api/teachers/[id]/availability/exceptions  — add exception (day off / special)
DELETE /api/teachers/[id]/availability/exceptions/[exceptionId]

GET  /api/teachers/[id]/schedule             
  Query: startDate, endDate
  Returns: all lessons in period + availability windows merged into timeline
  Used by: schedule view, conflict detection

GET  /api/teachers/availability-check
  Query: teacherId, date, startTime, endTime
  Returns: { isAvailable: boolean, conflicts: [], availabilityWindow: {} }

GET  /api/teachers/[id]/stats
  Returns: lessons this week/month, total hours, subjects breakdown, 
  groups taught, average lessons per week

━━━ UI PAGES ━━━

1. /app/teachers — Teacher Roster
   Grid view (default) with teacher cards showing:
   - Avatar (initials-based with their assigned color)
   - Name + subjects (tags)
   - Status: Available Now / In Lesson / No Availability Set (badges)
   - This week: X lessons / Y hours
   - Quick actions: View Schedule, Edit, Message

   List view toggle: table with more data
   Filter: by subject, by status, search by name

2. /app/teachers/[id] — Teacher Profile
   Header: Avatar, name, email, phone, subjects
   
   Tabs:
   ├── Overview: stats cards + recent lessons list
   ├── Availability: weekly availability editor (visual grid)
   │   - 7-day grid (Mon-Sun) × time slots (6am-10pm)
   │   - Click/drag to set available windows
   │   - Green = available, red = unavailable/exception
   │   - List of exceptions below grid
   ├── Schedule: mini-calendar of their lessons
   ├── Groups: groups they're assigned to
   └── Performance: lessons delivered, attendance rates (Premium)

3. Availability Editor Component
   Visual weekly grid where coordinators set when each teacher is available.
   
   Interactions:
   - Click a cell to toggle availability
   - Click + drag to select a range
   - Right-click for options: Set as available, Mark as exception
   - Exception modal: date, type (unavailable/special hours), reason
   
   Save updates all TeacherAvailability records atomically.

4. Teacher Invite Flow
   If teacher has no user account:
   - "Invite to workspace" button → sends email with join link
   - Teacher clicks link → sets password → linked to their Teacher record
   - They see limited view (their own schedule only)

Write complete code for all routes and pages.
```

---

### PROMPT 3.4 — Groups & Students (Vertical Slice)

```
Using the master context, build the Groups and Students vertical slices together
since they are tightly coupled.

━━━ STUDENTS API ━━━

GET  /api/students               — list (search by name, filter by grade, group)
POST /api/students               — create student
GET  /api/students/[id]          — detail with group memberships + lesson history  
PUT  /api/students/[id]          — update
DELETE /api/students/[id]        — soft delete

GET  /api/students/[id]/attendance   — attendance records across all lessons
GET  /api/students/[id]/schedule     — upcoming lessons across all groups

━━━ GROUPS API ━━━

GET  /api/groups                 — list groups with member count + teacher
POST /api/groups                 — create group
GET  /api/groups/[id]            — detail with members, teachers, lesson history
PUT  /api/groups/[id]            — update group
DELETE /api/groups/[id]          — soft delete

POST /api/groups/[id]/students        — add student to group
DELETE /api/groups/[id]/students/[studentId]  — remove student

POST /api/groups/[id]/teachers        — assign teacher
DELETE /api/groups/[id]/teachers/[teacherId]  — unassign teacher

GET  /api/groups/[id]/schedule        — all lessons for this group
GET  /api/groups/[id]/attendance-summary  — attendance stats per student

━━━ UI PAGES ━━━

1. /app/students — Student Roster
   Table: Name, Grade/Level, Groups (tags), Phone, Status, 
          Attendance Rate (%), Last Lesson Date, Actions
   
   Filters: Grade, Group, Status, search
   Import CSV button (bulk import students)

2. /app/students/[id] — Student Profile  
   Header: Name, grade, contact info, enrolled date
   Tabs:
   ├── Overview: groups enrolled, upcoming lessons, attendance summary donut chart
   ├── Attendance: lesson-by-lesson attendance table with status
   └── Notes: internal notes about student

3. /app/groups — Groups List
   Cards showing: Group name, subject, level badge, 
   teacher avatar(s), student count / max capacity, 
   next lesson date, color strip on left

4. /app/groups/[id] — Group Detail
   Header: Group name, subject, academic year, color
   
   Tabs:
   ├── Overview: stats + next 5 lessons preview
   ├── Students: roster with add/remove + attendance rates per student
   ├── Teachers: assigned teachers with primary/assistant roles
   ├── Schedule: this group's lesson calendar
   └── Attendance: full attendance matrix (students × lessons)

5. Attendance Tracker Component
   Shown inside lesson detail or group attendance tab.
   - List of students in the group for that lesson
   - Per student: Present / Absent / Late / Excused (radio or click-cycle)
   - Bulk mark all present button
   - Save attendance button (locked after 24 hours unless admin)

Write complete code for all routes and pages.
```

---

### PROMPT 3.5 — Schedule Calendar View

```
Using the master context, build the main Schedule view — 
the crown jewel of Busala's UI.

This is a full-featured calendar that must rival Google Calendar in UX 
quality but be purpose-built for school scheduling.

━━━ SCHEDULE PAGE (/app/schedule) ━━━

Views (toggle between):
1. Day View — vertical timeline of a single day
2. Week View — 7-column timeline (default)
3. Month View — monthly grid
4. Teacher View — side-by-side columns per teacher (for scheduling oversight)

━━━ CALENDAR COMPONENT REQUIREMENTS ━━━

Week/Day Timeline:
- Time column on left (06:00 → 22:00 in 30-min increments)
- Lessons rendered as colored blocks positioned by time
- Block shows: title, teacher name, group name, room
- Block height = proportional to duration
- Overlapping lessons shown side-by-side (detect visual overlaps)
- Conflict lessons show red border + conflict icon
- Click lesson block → opens lesson detail popover
- Click empty slot → opens "Create Lesson" form pre-filled with that time

Month View:
- Standard month grid
- Each day shows colored dots or lesson count
- Click a day → expand to show that day's lessons

Teacher View:
- One column per teacher (scroll horizontally for many teachers)  
- Their lessons shown in their column
- Empty slots shown as available/unavailable based on their availability
- Drag a lesson from one teacher column to another to reassign 
  (triggers conflict check before saving)

━━━ FILTERS & CONTROLS ━━━
Top bar:
- Date navigation (prev/next, today button, date picker jump)
- View switcher (Day/Week/Month/Teacher)
- Filter dropdown: by teacher, by group, by room, by subject, by status
- "Show conflicts only" toggle
- Color-by: teacher color or subject color or status color

━━━ DRAG & DROP ━━━
- Drag a lesson block to a new time slot to reschedule
- On drop: run conflict check → 
  If conflicts: show conflict modal (cancel or override)
  If clear: save new time
- Visual ghost while dragging
- Snap to 15-min intervals

━━━ CREATE FROM CALENDAR ━━━
- Click empty slot → pre-filled create form appears as a side panel
- Lesson preview shown on calendar in grey while form is open
- Close form → preview disappears

━━━ CONFLICT VISUALIZATION ━━━
- Lesson with conflict: red left border + ⚠ icon
- Hover shows conflict tooltip: "Teacher John has another lesson at this time"
- Conflicts panel (collapsible sidebar): list all unresolved conflicts with links

━━━ TECHNICAL APPROACH ━━━
- Build calendar from scratch (no heavy calendar library) 
  using CSS Grid for the time slots
- Use @dnd-kit/core for drag and drop
- Virtualize time slots for performance
- Load lessons for visible date range only (React Query)
- Optimistic updates on drag-drop

Write the complete Schedule page and all sub-components.
```

---

### PROMPT 3.6 — Rooms & Resource Management

```
Using the master context, build the Rooms vertical slice.

━━━ API ROUTES ━━━

GET  /api/rooms                  — list rooms
POST /api/rooms                  — create room
GET  /api/rooms/[id]             — room detail with schedule
PUT  /api/rooms/[id]             — update
DELETE /api/rooms/[id]           — soft delete

GET  /api/rooms/[id]/schedule
  Query: startDate, endDate
  Returns: all lessons booked in this room for the period

GET  /api/rooms/availability-check
  Query: roomId, startTime, endTime
  Returns: { isAvailable: boolean, conflictingLesson?: Lesson }

GET  /api/rooms/availability-matrix
  Query: date, startTime, endTime  
  Returns: all rooms with their availability status for a given slot
  Used by: "find available rooms" feature in lesson creation

━━━ UI PAGES ━━━

1. /app/rooms — Rooms list
   Cards showing: Room name, type badge, capacity, 
   current status (Available/In Use/Maintenance),
   today's lesson count, equipment tags

2. /app/rooms/[id] — Room detail
   Header: Name, type, capacity, floor/building, equipment
   Tabs:
   ├── Schedule: calendar view of room bookings
   ├── Stats: utilization rate, busiest times heatmap
   └── Settings: edit room details

3. Room Availability Matrix (used in lesson creation form)
   Given a time slot, show all rooms as:
   - Green: Available
   - Red: Booked (show by whom)
   - Grey: At capacity for this group size
   This helps coordinators quickly pick a room.

Write complete code.
```

---

## ═══════════════════════════════════════════
## SECTION 4 — ANALYTICS & REPORTING (Premium Feature)
## ═══════════════════════════════════════════

### PROMPT 4.1 — Analytics Dashboard

```
Using the master context, build the Analytics module.
This is a Premium feature — gate it behind plan check middleware.

━━━ API ROUTES ━━━

GET /api/analytics/overview
  Returns: KPIs for the selected date range
  - Total lessons scheduled / completed / cancelled
  - Completion rate (%)
  - Average lesson duration
  - Total teaching hours
  - Teacher utilization rates
  - Student attendance rates
  - Most/least active teachers

GET /api/analytics/teacher-performance
  Returns per teacher: lessons count, hours, completion rate, 
  average class size, subjects distribution

GET /api/analytics/student-attendance
  Returns per student: attendance rate, lessons attended/missed,
  groups enrolled, streak (consecutive attendance)

GET /api/analytics/schedule-heatmap
  Returns: lesson density by day-of-week × hour-of-day (for heatmap)

GET /api/analytics/conflict-report
  Returns: conflict history — how many, what types, resolution rates

GET /api/analytics/room-utilization
  Returns per room: hours used, usage %, peak times

━━━ UI PAGES ━━━

/app/reports — Analytics dashboard
  Date range picker (presets: This Week, This Month, Last Month, 
                    Academic Year, Custom)

  Section 1: Executive Summary (4 big KPI cards)
  Section 2: Lesson Trends (line chart — lessons per week)
  Section 3: Teacher Performance table (sortable)
  Section 4: Student Attendance (sortable table + distribution chart)
  Section 5: Schedule Heatmap (day × hour grid colored by density)
  Section 6: Conflict Analysis (bar chart of conflict types)
  Section 7: Room Utilization (horizontal bar chart per room)

  Export button: Download as PDF or CSV (per section)

Write complete code with real Recharts implementations.
```

---

## ═══════════════════════════════════════════
## SECTION 5 — BILLING & SUBSCRIPTIONS
## ═══════════════════════════════════════════

### PROMPT 5.1 — Stripe Integration & Plan Management

```
Using the master context, build the complete billing system.

━━━ STRIPE SETUP ━━━

1. Stripe Products & Prices:
   Create these products in Stripe (write the setup script):
   - Starter: $29/month — up to 10 teachers, 100 students, 3 groups, 2 rooms
   - Growth: $79/month — up to 30 teachers, 500 students, 15 groups, 10 rooms  
   - Enterprise: $199/month — unlimited everything + analytics + multi-branch
   - Add-ons: Extra Teacher Seat ($5/month each), Extra Branch ($49/month)

2. Webhook handler: POST /api/webhooks/stripe
   Handle these events:
   - checkout.session.completed → activate subscription
   - invoice.payment_succeeded → update subscription, create Invoice record
   - invoice.payment_failed → send payment failure email, flag tenant
   - customer.subscription.updated → update plan, adjust limits
   - customer.subscription.deleted → downgrade to free/suspend tenant

━━━ API ROUTES ━━━

POST /api/billing/checkout        — create Stripe checkout session
POST /api/billing/portal          — create Stripe customer portal session
GET  /api/billing/subscription    — current subscription details
GET  /api/billing/invoices        — list invoices
GET  /api/billing/usage           — current usage vs plan limits

━━━ PLAN ENFORCEMENT MIDDLEWARE ━━━

Write a middleware/helper: checkPlanLimit(tenantId, resource)
Resources: 'teachers', 'students', 'groups', 'rooms', 'analytics'

Used like:
  const check = await checkPlanLimit(tenantId, 'teachers')
  if (!check.allowed) {
    return { error: 'PLAN_LIMIT_REACHED', limit: check.limit, current: check.current }
  }

Apply this in all POST routes that create resources.

━━━ UI ━━━

/app/settings/billing page:
- Current plan card (name, price, features included)
- Usage meters: Teachers X/Y, Students X/Y, Groups X/Y
- Upgrade Plan button → opens plan comparison modal
- Billing history table (invoices with download PDF)
- Payment method display
- Cancel subscription option (with retention modal)

Plan Comparison Modal:
- 3-column comparison table (Starter / Growth / Enterprise)
- Feature checklist per column
- "Current Plan" badge on active plan
- CTA buttons → redirect to Stripe checkout

Write all code completely.
```

---

## ═══════════════════════════════════════════
## SECTION 6 — NOTIFICATIONS & REAL-TIME
## ═══════════════════════════════════════════

### PROMPT 6.1 — Notification System

```
Using the master context, build the notification system.

━━━ NOTIFICATION TYPES ━━━

System notifications (in-app):
- LESSON_CONFLICT_DETECTED: "Lesson conflict detected for [Teacher] on [Date]"
- LESSON_UPCOMING: "You have a lesson in 30 minutes" (for teachers)  
- LESSON_CANCELLED: "Lesson [Title] has been cancelled"
- LESSON_RESCHEDULED: "Lesson [Title] moved to [new time]"
- TEACHER_INVITATION: "You've been invited to join [Org] on Busala"
- PLAN_LIMIT_WARNING: "You're at 90% of your teacher limit"
- TRIAL_EXPIRING: "Your trial ends in 3 days"

Email notifications (via Resend):
- Welcome email (on signup)
- Teacher invitation email
- Lesson reminder (day before, optional)
- Payment failure warning

━━━ API ROUTES ━━━

GET  /api/notifications           — get user's notifications (unread first)
PUT  /api/notifications/[id]/read — mark as read
PUT  /api/notifications/read-all  — mark all as read
DELETE /api/notifications/[id]    — dismiss

POST /api/notifications/preferences  — save notification preferences

━━━ NOTIFICATION SERVICE ━━━

Write NotificationService class with:
- createNotification(tenantId, userId, type, data): Promise<void>
- sendEmail(to, template, data): Promise<void>
- notifyConflictDetected(lesson, conflicts): Promise<void>
- notifyLessonChange(lesson, changeType): Promise<void>
- notifyInvitation(invitation): Promise<void>

━━━ EMAIL TEMPLATES ━━━

Using React Email, create templates for:
1. Welcome email — with getting started checklist
2. Teacher invitation — with accept link + preview of what Busala is
3. Lesson reminder — with lesson details
4. Payment failed — with retry link

━━━ UI ━━━

Notifications bell dropdown in TopNav:
- Unread count badge
- Dropdown shows last 10 notifications
- Each notification: icon + message + time ago + read indicator
- "Mark all read" button
- "View all" link → /app/notifications full page

Full notifications page:
- All notifications paginated
- Filter by type
- Bulk mark read / delete

Write complete code for all components.
```

---

## ═══════════════════════════════════════════
## SECTION 7 — SETTINGS & TENANT CONFIGURATION
## ═══════════════════════════════════════════

### PROMPT 7.1 — Tenant Settings

```
Using the master context, build the complete Settings section.

/app/settings — Settings shell with sub-navigation:

1. /app/settings/general — Organization settings
   - Logo upload (with preview + crop)
   - Organization name, email, phone
   - Address, country, timezone
   - Academic year settings (start/end month)
   - Default lesson duration
   - Working days configuration (which days lessons can be scheduled)
   - Working hours (start/end of school day)
   - Default lesson color scheme

2. /app/settings/team — Team members management
   Table: Name, Email, Role, Status, Last Login, Actions
   
   Roles with explanations:
   - Owner: full access, billing, can delete org
   - Admin: full access except billing
   - Coordinator: manage schedule, teachers, students, groups
   - Teacher: view own schedule only (limited access)
   - Viewer: read-only access
   
   Invite member button:
   - Enter email + select role → sends invitation email
   - Pending invitations shown separately with resend/cancel options
   
   Remove member button (with confirmation)
   Change role (inline select)

3. /app/settings/billing — (already built in Section 5)

4. /app/settings/integrations — Future integrations placeholder
   Show: Google Calendar sync (coming soon), WhatsApp notifications (coming soon)
   
5. /app/settings/data — Data management  
   Export all data as CSV (teachers, students, groups, lessons)
   Import students from CSV
   Danger zone: Delete organization (requires typing org name)

━━━ ROLE-BASED ACCESS CONTROL ━━━

Write a comprehensive RBAC system:

const permissions = {
  'lessons.create': ['OWNER', 'ADMIN', 'COORDINATOR'],
  'lessons.edit': ['OWNER', 'ADMIN', 'COORDINATOR'],
  'lessons.delete': ['OWNER', 'ADMIN'],
  'lessons.view': ['OWNER', 'ADMIN', 'COORDINATOR', 'TEACHER', 'VIEWER'],
  'lessons.override-conflict': ['OWNER', 'ADMIN'],
  'teachers.create': ['OWNER', 'ADMIN', 'COORDINATOR'],
  'teachers.edit': ['OWNER', 'ADMIN', 'COORDINATOR'],
  'teachers.delete': ['OWNER', 'ADMIN'],
  'students.create': ['OWNER', 'ADMIN', 'COORDINATOR'],
  'groups.manage': ['OWNER', 'ADMIN', 'COORDINATOR'],
  'analytics.view': ['OWNER', 'ADMIN'],
  'billing.manage': ['OWNER'],
  'settings.manage': ['OWNER', 'ADMIN'],
  'team.manage': ['OWNER', 'ADMIN'],
} as const

Write:
- hasPermission(userRole, permission): boolean
- usePermission(permission): boolean (React hook)
- PermissionGate component: <PermissionGate permission="lessons.create"> ... </PermissionGate>
- withPermission HOC for API routes

Apply permissions throughout all API routes and UI components.
```

---

## ═══════════════════════════════════════════
## SECTION 8 — TESTING, DEPLOYMENT & OPERATIONS
## ═══════════════════════════════════════════

### PROMPT 8.1 — Testing Suite

```
Using the master context, build the comprehensive test suite.

━━━ UNIT TESTS (Vitest) ━━━

1. ConflictDetectionService tests (most critical)
   File: __tests__/conflicts.test.ts
   Test all conflict scenarios:
   - Happy path: no conflicts
   - Teacher double booked (same time)
   - Teacher double booked (overlapping)
   - Room double booked
   - Teacher outside availability window
   - Teacher has exception on that day
   - Student group overlap
   - Recurring pattern conflict detection
   - Conflict override logic
   - Edge: lesson exactly back-to-back (should NOT conflict)
   - Edge: lesson spanning midnight

2. Permission system tests
   File: __tests__/permissions.test.ts
   Test every role × every permission combination

3. Tenant isolation tests
   File: __tests__/tenant-isolation.test.ts
   Verify that querying with tenant A's context never returns tenant B's data

4. Plan limit enforcement tests
   File: __tests__/plan-limits.test.ts
   Verify limits are enforced correctly per plan

━━━ INTEGRATION TESTS (Vitest + test DB) ━━━

File: __tests__/integration/lessons.test.ts
- Create lesson API end-to-end
- Conflict detection via API
- Update lesson with conflict
- Override conflict via API
- Recurring lesson generation

File: __tests__/integration/auth.test.ts
- Login success / failure
- Session persistence
- Tenant isolation in session
- Role enforcement on routes

━━━ E2E TESTS (Playwright) ━━━

File: e2e/onboarding.spec.ts
- Full signup → onboarding → first lesson scheduled flow

File: e2e/schedule.spec.ts  
- Create a lesson
- Drag to reschedule
- Trigger conflict warning
- Override conflict

File: e2e/teacher-availability.spec.ts
- Set teacher availability
- Create lesson respecting availability
- Create lesson outside availability — see warning

━━━ TEST HELPERS ━━━

Write these test utilities:
- createTestTenant(): creates a tenant with owner user
- createTestTeacher(tenantId): creates a teacher with default availability
- createTestStudent(tenantId): creates a student
- createTestGroup(tenantId, teacherId, studentIds): creates a group
- createTestLesson(tenantId, overrides): creates a lesson
- cleanupTestData(): wipes test data between tests

Write all test files completely.
```

---

### PROMPT 8.2 — Production Deployment

```
Using the master context, set up production deployment configuration.

━━━ ENVIRONMENT SETUP ━━━

Write complete .env.production.example with all variables:
- Database: DATABASE_URL (Supabase/Railway PostgreSQL)
- Auth: NEXTAUTH_SECRET, NEXTAUTH_URL
- Stripe: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, 
         STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_IDs
- Email: RESEND_API_KEY, FROM_EMAIL
- Storage: R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET
- Redis: UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
- App: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_APP_DOMAIN

━━━ VERCEL CONFIG ━━━

vercel.json:
- Subdomain wildcard routing (*.busala.com → tenant workspace)
- Edge middleware for tenant resolution
- Environment variable groups

━━━ DATABASE ━━━

Write production database setup:
1. Supabase project setup script
2. Enable Row Level Security on all tenant tables
3. Connection pooling config (PgBouncer)
4. Backup strategy (point-in-time recovery)
5. Index audit — ensure all needed indexes exist

━━━ MONITORING ━━━

Set up basic observability:
1. Sentry error tracking (install + configure with tenant context)
2. Vercel Analytics
3. Custom logging service: log tenant ID, user ID, action on every API call
4. Uptime monitoring: write health check endpoint GET /api/health
   Returns: { db: 'ok', redis: 'ok', version: string, timestamp: string }

━━━ CI/CD ━━━

Write GitHub Actions workflows:
1. .github/workflows/test.yml
   - On every PR: run lint, type check, unit tests, integration tests
   - Block merge if tests fail

2. .github/workflows/deploy.yml
   - On merge to main: deploy to Vercel
   - Run E2E tests against preview URL before promoting to production
   - Send Slack notification on deploy

━━━ SECURITY CHECKLIST ━━━

Implement and verify:
- [ ] All API routes check authentication
- [ ] All tenant-scoped routes verify tenantId matches session
- [ ] SQL injection: Prisma parameterized queries only (no raw SQL with user input)
- [ ] XSS: all user input escaped by React (verify no dangerouslySetInnerHTML)
- [ ] CSRF: Next.js built-in protection verified
- [ ] Rate limiting: 100 req/min per IP on auth endpoints (using Upstash)
- [ ] Stripe webhook signature verification
- [ ] File upload: validate type and size, scan for malware (Cloudflare)
- [ ] Environment variables: never exposed to client (NEXT_PUBLIC_ only for safe vars)
- [ ] Dependency audit: npm audit in CI

Write all configuration files and workflows completely.
```

---

## ═══════════════════════════════════════════
## SECTION 9 — MARKETING SITE & LANDING PAGE
## ═══════════════════════════════════════════

### PROMPT 9.1 — Public Marketing Site

```
Using the master context, build the public marketing website at busala.com.

Design direction:
- Dark premium (#0A0B0F), gold accents (#C9A84C)
- Font: Syne (headings) + DM Mono (accent text) + readable body font
- Institutional and premium — not startup-y or playful
- Conversions focused: every section leads toward "Start Free Trial"

━━━ PAGES ━━━

1. / — Homepage
   Sections:
   a. Hero: "Stop Scheduling on WhatsApp." 
      Headline + subheadline + "Start Free Trial" CTA + product screenshot
      Animated: schedule conflicts turning green as Busala resolves them
   
   b. Problem Statement: Show the chaos (Excel, WhatsApp, whiteboard)
      vs The Solution (Busala dashboard)
   
   c. Core Features (3 columns):
      - Conflict-Free Scheduling
      - Teacher Availability Management  
      - Real-Time Operational Dashboard
   
   d. How It Works (3 steps): 
      Set up → Schedule → Operate with clarity
   
   e. Feature Deep-Dive (alternating image + text sections):
      - Conflict Detection Engine
      - Teacher Availability System
      - Group & Student Management
      - Analytics & Reporting
   
   f. Pricing Section (3 tiers with feature comparison table)
   
   g. Testimonials (placeholder for real quotes)
   
   h. FAQ Accordion (10 common questions)
   
   i. Final CTA: "Join 200+ schools running on Busala"
   
   j. Footer: links, legal, social

2. /pricing — Dedicated pricing page
   Same pricing table but more detailed feature comparison

3. /features — Features overview page

4. /blog — Blog index (static for now, content via MDX)

5. /legal/privacy — Privacy Policy
6. /legal/terms — Terms of Service

Write complete, production-ready code for all marketing pages.
The homepage must have impressive, scroll-triggered animations.
```

---

## ═══════════════════════════════════════════
## SECTION 10 — FUTURE ROADMAP PROMPTS
## ═══════════════════════════════════════════

### PROMPT 10.1 — Multi-Branch Support (Enterprise Feature)

```
Using the master context, extend Busala to support multi-branch organizations.
An Enterprise tenant can have multiple branches (campuses), each with their own:
- Teachers, Students, Groups, Rooms
- But shared management from one admin account
- Cross-branch reports for the org owner

Add Branch model:
model Branch {
  id, tenantId, name, address, phone, timezone, isActive, 
  managerId (User), createdAt, updatedAt
}

Add branchId to: Teacher, Student, Group, Room, Lesson
Super-admin and Org Owner can see all branches.
Branch managers see only their branch.
```

---

### PROMPT 10.2 — AI Scheduling Assistant (Future)

```
Using the master context, add AI-powered schedule optimization.

Feature: "Auto-Schedule" — given a list of groups, teachers, and constraints,
generate the optimal weekly schedule with zero conflicts.

Build:
1. ScheduleOptimizer service using a constraint satisfaction algorithm:
   - Input: list of groups (required lessons per week), teacher availability, 
     room availability, school working hours
   - Output: proposed schedule (list of lessons) with 0 hard conflicts
   - Algorithm: backtracking with forward checking

2. UI: "Generate Schedule" wizard
   - Select groups to schedule
   - Set constraints (preferred times, teacher preferences)
   - Preview generated schedule
   - Accept all / modify individual lessons / regenerate

3. Future: integrate Claude API (Anthropic) for natural language scheduling:
   "Schedule Ahmed's English group 3x per week, never before 10am,
    avoid Friday afternoons"
```

---

## ═══════════════════════════════════════════
## QUICK REFERENCE — BUILD ORDER
## ═══════════════════════════════════════════

```
WEEK 1-2: Foundation
  □ Section 1.1 — Project scaffold + Turborepo setup
  □ Section 1.2 — Complete Prisma schema
  □ Section 1.3 — Auth + tenant middleware

WEEK 3-4: Super Admin CRM
  □ Section 2.1 — Super admin dashboard + tenant CRUD
  □ Section 2.2 — Tenant onboarding wizard

WEEK 5-6: Core Product (Lessons)
  □ Section 3.1 — Tenant workspace shell + navigation
  □ Section 3.2 — Lessons engine + conflict detection (most important)

WEEK 7-8: Resources
  □ Section 3.3 — Teachers + availability
  □ Section 3.4 — Groups + students
  □ Section 3.5 — Schedule calendar view

WEEK 9: Supporting Features
  □ Section 3.6 — Rooms
  □ Section 4.1 — Analytics dashboard
  □ Section 7.1 — Settings + RBAC

WEEK 10: Monetization
  □ Section 5.1 — Stripe billing integration
  □ Section 6.1 — Notifications system

WEEK 11: Quality
  □ Section 8.1 — Testing suite
  □ Section 8.2 — Production deployment

WEEK 12: Marketing
  □ Section 9.1 — Public marketing site
  □ Launch 🚀
```

---

## ═══════════════════════════════════════════
## KEY PRINCIPLES — ALWAYS FOLLOW
## ═══════════════════════════════════════════

```
1. NEVER skip the conflict detection on lesson creation or update — it runs every time.

2. ALWAYS include tenantId in every query to a tenant-scoped table — no exceptions.

3. NEVER return data from one tenant in another tenant's request — 
   test this in every vertical slice.

4. TypeScript strict mode — no `any`, no `as unknown as X` hacks.

5. Zod validation on every API input — never trust user input.

6. Plan limits enforced on every resource creation API call.

7. Audit log every significant action (lesson create/cancel/override, 
   teacher create, student add/remove).

8. The calendar view is the product — it must be fast, smooth, and accurate.

9. Vertical slices — each domain must be: DB ✓ → API ✓ → Tests ✓ → UI ✓
   before moving to the next. No half-built features.

10. The Super Admin CRM is your control center — build it to be powerful 
    and trustworthy, not an afterthought.
```

---

*This document is your complete build specification for Busala.*
*Start from Section 0 and work through each prompt in order.*
*Paste Section 0 (Master Context) at the beginning of every AI conversation.*
