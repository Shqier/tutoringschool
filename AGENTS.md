# Busala - AI Coding Agent Guide

Busala is a school management system (SMS) built as a full-stack web application using Next.js, TypeScript, PostgreSQL, Prisma, and Auth0. It provides CRUD operations for managing teachers, students, groups, rooms, lessons, and approvals with scheduling conflict detection, teacher availability enforcement, and role-based access control.

---

## Project Overview

**Name**: Busala School Management System  
**Type**: Full-stack web application (Next.js App Router)  
**Primary Language**: English (code), English (documentation)  
**License**: Private

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Database | PostgreSQL 14+ |
| ORM | Prisma 7.3.0 |
| Authentication | Auth0 (@auth0/nextjs-auth0) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Icons | lucide-react |
| Forms | react-hook-form + Zod |
| Testing | Vitest + @testing-library/react |
| Linting | ESLint (Next.js config) |

---

## Directory Structure

```
prisma/
├── schema.prisma           # Database schema definition
├── migrations/             # Prisma migration files
└── prisma.config.ts        # Prisma CLI configuration

src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Route group with AppShell layout (protected)
│   │   ├── page.tsx        # Dashboard home
│   │   ├── layout.tsx      # AppShell wrapper
│   │   ├── teachers/       # Teachers page
│   │   ├── students/       # Students page
│   │   ├── groups/         # Groups page
│   │   ├── rooms/          # Rooms page
│   │   ├── lessons/        # Lessons page
│   │   ├── approvals/      # Approvals page
│   │   ├── scheduling/     # Scheduling page
│   │   └── settings/       # Settings page
│   ├── (marketing)/        # Public marketing pages
│   │   ├── features/       # Features page
│   │   ├── pricing/        # Pricing page
│   │   ├── contact/        # Contact page
│   │   └── layout.tsx      # Marketing layout
│   ├── api/                # API routes (Route Handlers)
│   │   ├── auth/           # Auth0 routes ([...auth0]/route.ts)
│   │   ├── teachers/       # /api/teachers + tests
│   │   ├── students/       # /api/students + tests
│   │   ├── groups/         # /api/groups + tests
│   │   ├── rooms/          # /api/rooms
│   │   ├── lessons/        # /api/lessons + tests
│   │   ├── approvals/      # /api/approvals
│   │   ├── scheduling/     # /api/scheduling
│   │   └── debug/          # Debug endpoints
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── layout.tsx          # Root layout with Auth0 provider
│   ├── page.tsx            # Root redirect to /login
│   └── globals.css         # Design tokens & CSS variables
├── components/
│   ├── app/                # Application-level components
│   │   ├── AppShell.tsx    # Main layout wrapper
│   │   ├── PageHeader.tsx  # Page header component
│   │   ├── DataTableShell.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── index.ts        # Barrel export
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── TopNav.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── StatMiniCard.tsx
│   │   └── index.ts
│   ├── teachers/           # Teacher-specific components
│   ├── students/           # Student-specific components
│   ├── groups/             # Group-specific components
│   ├── rooms/              # Room-specific components
│   ├── lessons/            # Lesson-specific components
│   ├── marketing/          # Marketing page components
│   └── ui/                 # shadcn/ui components (button, card, etc.)
├── hooks/                  # React custom hooks
│   ├── useEntityDialog.ts
│   └── useAuth.ts
├── lib/                    # Application logic
│   ├── api/                # API client
│   │   ├── client.ts       # Typed fetch wrapper
│   │   ├── types.ts        # API type definitions
│   │   ├── hooks.ts        # React Query/SWR hooks
│   │   └── index.ts
│   ├── auth/               # Auth0 configuration
│   │   ├── config.ts       # Auth0 config & validation
│   │   └── session.ts      # Session helpers
│   ├── db/                 # Database layer
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── seed-prisma.ts  # Database seeding
│   │   ├── types.ts        # Database types
│   │   └── index.ts
│   ├── scheduling/         # Scheduling logic
│   │   ├── conflicts.ts    # Conflict detection
│   │   ├── teacher-availability.ts
│   │   └── __tests__/
│   ├── test/               # Test utilities
│   │   ├── setup.ts        # Vitest setup
│   │   └── db-helpers.ts   # Test database helpers
│   ├── validators/         # Zod schemas
│   │   └── schemas.ts
│   ├── api-utils.ts        # API utility functions
│   └── utils.ts            # General utilities (cn function)
├── types/
│   └── dashboard.ts        # Shared TypeScript interfaces
├── data/
│   └── mock-data.ts        # Mock data for development
└── middleware.ts           # Next.js middleware (Auth0 + custom auth)

ref/                        # Reference documentation
├── ARCHITECTURE.md
├── COMPONENTS.md
├── DATA_TYPES.md
└── DESIGN_TOKENS.md

scripts/                    # Utility scripts
└── verify-availability.ts
```

---

## Build, Test, and Development Commands

### Development

```bash
# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database (Prisma)

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Run migrations in development
npx prisma migrate dev

# Deploy migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with initial data
npx prisma db seed
```

### Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

Tests are located in `__tests__/` directories next to the code they test. Tests run sequentially (`fileParallelism: false`) to avoid database conflicts.

### Linting

```bash
# Run ESLint
npm run lint
```

No Prettier is configured; follow ESLint auto-fixes for formatting.

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies and scripts |
| `tsconfig.json` | TypeScript configuration (strict mode, path alias `@/*`) |
| `next.config.ts` | Next.js configuration (Turbopack enabled by default) |
| `vitest.config.ts` | Vitest test configuration |
| `eslint.config.mjs` | ESLint configuration (Next.js core-web-vitals + TS) |
| `prisma/schema.prisma` | Database schema |
| `prisma.config.ts` | Prisma CLI configuration |
| `.env` / `.env.local` | Environment variables (not committed) |
| `.env.example` | Environment variable template |
| `components.json` | shadcn/ui configuration |
| `postcss.config.mjs` | PostCSS configuration for Tailwind v4 |

---

## Coding Style Guidelines

### TypeScript

- **Strict mode enabled** - all code must be fully typed
- Use `type` over `interface` for simple type aliases
- Path alias `@/` maps to `./src/`
- Import order: external libs → internal modules → relative imports

### Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase | `TeacherDialog.tsx` |
| Hooks | camelCase with `use` prefix | `useEntityDialog.ts` |
| Utils/DB/API | camelCase | `checkConflicts.ts` |
| Types/Interfaces | PascalCase | `Teacher`, `CreateLessonInput` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_ORG_ID` |
| Enums | PascalCase values | `UserRole.admin` |

### File Organization

- Components use barrel exports via `index.ts`
- One main export per file, named after the file
- Keep components focused and small
- Co-locate related components in feature folders

### React Conventions

- Use `'use client'` for interactive components (hooks, event handlers)
- Server Components are the default (no directive needed)
- Props interfaces named `{ComponentName}Props`
- Prefer composition over configuration

---

## Testing Strategy

### Framework

- **Vitest** for unit and integration tests
- **@testing-library/react** for component tests
- **happy-dom** as the DOM environment

### Test File Locations

```
src/app/api/teachers/__tests__/route.test.ts
src/app/api/teachers/__tests__/[id].route.test.ts
src/lib/scheduling/__tests__/teacher-availability.test.ts
```

### Test Patterns

1. **Database tests**: Clean database before each test via `setup.ts`
2. **Use test helpers** from `src/lib/test/db-helpers.ts`:
   - `createTestTeacher()`
   - `createTestRoom()`
   - `createTestGroup()`
   - `createTestStudent()`
   - `createTestLesson()`
   - `cleanDatabase()`
3. **API tests**: Use `createTestHeaders()` for auth headers

### Test Data

- Default org ID: `org_busala_default`
- Default user role: `admin`
- Tests run sequentially to avoid DB conflicts

---

## Database Architecture

### Models

```
User          # System users (admin, manager, teacher, staff)
Teacher       # Teachers with availability (JSON fields)
Student       # Students with group assignments
Room          # Physical rooms
Group         # Student groups with schedule rules
Lesson        # Scheduled lessons (core entity)
Approval      # Approval requests
```

### Key Design Patterns

1. **Organization isolation**: All entities have `orgId` field
2. **JSON fields for flexible data**:
   - `Teacher.weeklyAvailability: Json` - Array of availability slots
   - `Teacher.availabilityExceptions: Json` - Array of exception periods
   - `Group.scheduleRule: Json` - Recurring schedule definition
3. **Soft constraints via application logic** - no complex DB constraints

### Important Indexes

- `@@index([orgId])` on all main entities
- `@@index([orgId, id])` composite for availability queries
- `@@index([teacherId])`, `@@index([roomId])` on lessons

---

## API Architecture

### Route Structure

```
GET    /api/teachers          # List with pagination, filtering
POST   /api/teachers          # Create
GET    /api/teachers/[id]     # Get single
PATCH  /api/teachers/[id]     # Update
DELETE /api/teachers/[id]     # Delete
```

### Authentication

The application uses **Auth0** for authentication with fallback for development:

**Production (Auth0)**:
- Configured via `@auth0/nextjs-auth0` package
- Routes: `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`
- Session stored in `appSession` cookie
- Middleware validates session and sets headers for API routes

**Required Environment Variables**:
```
AUTH0_SECRET
AUTH0_BASE_URL
AUTH0_ISSUER_BASE_URL
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
AUTH0_SCOPE
AUTH0_AUDIENCE (optional)
```

**Development Fallback**:
Headers can be set directly for testing:
```
x-user-role: admin | manager | teacher | staff
x-user-id: <user-id>
x-org-id: <org-id>
```

### Authorization (Role-Based)

| Role | Permissions |
|------|-------------|
| staff | Read access to all resources |
| teacher | (Reserved for future use) |
| manager | Create, update resources |
| admin | Full access including delete |

Use `requireRole(request, minimumRole)` from `api-utils.ts`.

### Response Formats

**Success (200/201)**:
```json
{ "id": "...", "name": "..." }
```

**Success with pagination**:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5, "hasMore": true }
}
```

**Error (400/401/403/404/409/500)**:
```json
{ "error": { "code": "ERROR_CODE", "message": "...", "details": [...] } }
```

**Conflict (409)**:
```json
{
  "error": "Conflict detected",
  "conflicts": {
    "teacher": [...],
    "room": [...],
    "availability": [...]
  }
}
```

### Force Override Headers

To bypass availability checks (but not double-booking):
- `x-force-create: true` (for POST)
- `x-force-update: true` (for PATCH)

---

## Scheduling & Availability System

### Teacher Availability Architecture

**Priority Order (highest to lowest)**:

1. **UNAVAILABLE exceptions** - Always blocks
2. **AVAILABLE exceptions** - Allows time outside weekly schedule
3. **Weekly availability** - Default recurring schedule
4. **Otherwise** - Reject with `OUTSIDE_AVAILABILITY`

### Data Structures

**WeeklyAvailability** (stored in `Teacher.weeklyAvailability`):
```typescript
{
  dayOfWeek: number;    // 0=Sunday, 6=Saturday
  startTime: string;    // "HH:MM" format
  endTime: string;      // "HH:MM" format
}
```

**AvailabilityException** (stored in `Teacher.availabilityExceptions`):
```typescript
{
  id: string;           // UUID
  type: "unavailable" | "available";
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  allDay: boolean;
  startTime?: string;   // HH:mm (if !allDay)
  endTime?: string;     // HH:mm (if !allDay)
  reason?: string;
}
```

### Conflict Detection

- **Teacher conflicts**: Same teacher, overlapping times
- **Room conflicts**: Same room, overlapping times
- **Availability violations**: Lesson outside teacher's available hours

Use `checkAllConflicts()` from `src/lib/scheduling/conflicts.ts`.

---

## Design System

### Colors (CSS Variables)

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--busala-gold` | #F5A623 | #F5A623 | Primary accent |
| `--busala-bg-primary` | #F8F9FA | #0B0D10 | Page background |
| `--busala-bg-card` | #FFFFFF | #14171C | Card background |
| `--busala-text-primary` | #1A1D24 | #FFFFFF | Primary text |
| `--busala-text-muted` | rgba(0,0,0,0.6) | rgba(255,255,255,0.6) | Secondary text |

### Layout

- **TopNav**: Fixed, 72px height (`--busala-topnav-height`)
- **Sidebar**: Fixed left, 240px width (`--busala-sidebar-width`)
- **Main content**: `ml-[240px] pt-[72px]`
- **Card radius**: 16px
- **Item radius**: 12px
- **Spacing**: 8px grid (8, 12, 16, 24, 32)

### Utility Classes

```css
.busala-card           /* Glass effect card */
.busala-bg-gradient    /* Radial background gradient */
.busala-nav-active     /* Active navigation item */
```

---

## Middleware & Authentication Flow

The `src/middleware.ts` file handles:

1. **Public path detection**: Routes like `/`, `/login`, `/api/auth/*` bypass auth
2. **Session validation**: Checks `appSession` cookie (Auth0)
3. **Header injection**: Sets `x-user-id`, `x-user-role`, `x-org-id`, `x-user-email` for API routes
4. **Redirect handling**: Unauthenticated users redirect to `/login`

---

## Security Considerations

1. **Environment variables**: Never commit `.env` or `.env.local`. Use `.env.example` as template.
2. **Database credentials**: Store in `DATABASE_URL` env var only.
3. **Authentication**: Auth0 for production, fallback to header-based auth for development.
4. **Authorization**: Always use `requireRole()` helper in API routes.
5. **Input validation**: All API inputs validated with Zod schemas.
6. **SQL Injection**: Prevented by Prisma ORM query building.
7. **Session Security**: Auth0 manages session securely with httpOnly cookies.

---

## Development Workflow

### Adding a New Feature

1. Update Prisma schema if needed
2. Run `npx prisma migrate dev`
3. Update Zod schemas in `src/lib/validators/schemas.ts`
4. Create/update API routes
5. Add tests in `__tests__/` directory
6. Create/update UI components
7. Wire up API client in `src/lib/api/client.ts`

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Run `npx prisma generate`
4. Update seed script if needed: `src/lib/db/seed-prisma.ts`

### Testing Workflow

1. Write test using test helpers
2. Run `npm test` to verify
3. Run `npm run test:coverage` to check coverage
4. Fix any failing tests before committing

---

## Reference Documentation

Additional documentation in `ref/` directory:

- **ARCHITECTURE.md** - High-level architecture overview
- **COMPONENTS.md** - Component inventory and patterns
- **DESIGN_TOKENS.md** - Design system details
- **DATA_TYPES.md** - TypeScript interfaces reference

---

## Common Issues & Solutions

### Database Connection

**Issue**: `DATABASE_URL` not found  
**Solution**: Copy `.env.example` to `.env.local` and configure your PostgreSQL connection string.

### Prisma Client

**Issue**: Prisma client out of sync with schema  
**Solution**: Run `npx prisma generate` after schema changes.

### Test Failures

**Issue**: Tests fail with database errors  
**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correctly set. Tests require a real database connection.

### Type Errors

**Issue**: TypeScript errors after schema change  
**Solution**: Run `npx prisma generate` to regenerate types, then restart TypeScript server.

### Auth0 Configuration

**Issue**: Auth0 authentication fails  
**Solution**: 
1. Ensure all `AUTH0_*` environment variables are set
2. Verify callback URLs in Auth0 dashboard match your app
3. Check that `AUTH0_SECRET` is at least 32 characters

---

## Quick Reference

### HTTP Status Codes Used

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST (created) |
| 400 | Validation error |
| 401 | Unauthorized (no valid session) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate or scheduling conflict) |
| 500 | Internal server error |

### Common Import Patterns

```typescript
// Database
import { prisma } from '@/lib/db/prisma';

// API utilities
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

// Validation schemas
import { createTeacherSchema } from '@/lib/validators/schemas';

// API client (frontend)
import { getTeachers, createTeacher } from '@/lib/api/client';

// Types
import type { Teacher, CreateTeacherInput } from '@/lib/api/types';

// UI components
import { Button, Card, Dialog } from '@/components/ui';

// Dashboard components
import { TopNav, SidebarNav } from '@/components/dashboard';
```
