# Busala Dashboard - Developer Guide

## Quick Start

```bash
npm run dev     # Start dev server (localhost:3000)
npm run build   # Build for production
npm run lint    # Run linter
```

## Project Overview

School management dashboard built with Next.js App Router, Tailwind CSS, and shadcn/ui.

**Tech Stack**: PostgreSQL + Prisma ORM, Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui

## Current Status

**Phase 1 Complete**: Lessons Vertical Slice ✅
- Full CRUD for lessons with conflict detection
- Teacher/room double-booking prevention
- Force override support (x-force-create, x-force-update headers)
- Conflict resolution UI
- 70+ passing tests

**Phase 2 Complete**: Teacher Availability Enforcement ✅
- Weekly availability scheduling (by day/time)
- Availability exceptions (vacations, sick days, available overrides)
- Lesson creation enforces teacher availability
- UI for managing availability and exceptions
- Conflict detection with clear error messages (OUTSIDE_AVAILABILITY)

**Phase 3 Complete**: Teachers & Groups APIs ✅
- Teachers API: Full CRUD with 60 tests
- Groups API: Full CRUD with 66 tests
- Role-based authorization (staff/manager/admin)
- Organization isolation (orgId enforcement)
- Duplicate detection with 409 conflicts

**Phase 4 Complete**: Students API & Contract Verification ✅
- Students API: Full CRUD with 78 tests
- Consistent error format across all APIs
- Verified authorization patterns (intentionally lower for students)
- Pagination, filtering, and search consistent
- 274 total tests passing

**Backend**: PostgreSQL with Prisma ORM, header-based dev auth
**Frontend**: Fully wired to API with conflict handling
**Tests**: 274 passing (API-level integration tests)

## Reference Documentation

- **[Architecture](ref/ARCHITECTURE.md)** - Project structure, layout system
- **[Components](ref/COMPONENTS.md)** - Component inventory and usage
- **[Design Tokens](ref/DESIGN_TOKENS.md)** - Colors, spacing, shadows
- **[Data Types](ref/DATA_TYPES.md)** - TypeScript interfaces

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Dashboard page |
| `src/app/globals.css` | Design tokens |
| `src/components/dashboard/` | Dashboard components |
| `src/components/ui/` | shadcn/ui components |
| `src/types/dashboard.ts` | TypeScript types |
| `src/data/mock-data.ts` | Mock data |
| `src/lib/scheduling/` | Conflict & availability logic |
| `src/components/teachers/` | Teacher-specific components |

## 🔒 LOCKED DATA MODEL - Phase 2 (DO NOT CHANGE)

### Teacher Availability Architecture

**CANONICAL MODELS** - These are the source of truth:

#### 1. Teacher Model (PostgreSQL via Prisma)
```typescript
model Teacher {
  id: string
  fullName: string
  email: string
  weeklyAvailability: Json      // WeeklyAvailability[] (see below)
  availabilityExceptions: Json  // AvailabilityException[] (see below)
  orgId: string
  // ... other fields
}
```

**Indexes on Teacher:**
- `@@index([orgId])`
- `@@index([orgId, id])` - for availability queries

#### 2. WeeklyAvailability (JSON field on Teacher)
Defines recurring weekly schedule. Stored as JSON array in `Teacher.weeklyAvailability`.

```typescript
interface WeeklyAvailability {
  dayOfWeek: number    // 0=Sunday, 6=Saturday
  startTime: string    // "HH:MM" format (e.g., "09:00")
  endTime: string      // "HH:MM" format (e.g., "17:00")
}
```

**Example:**
```json
[
  { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" },
  { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00" }
]
```

#### 3. AvailabilityException (JSON field on Teacher)
Date-specific overrides. Stored as JSON array in `Teacher.availabilityExceptions`.

```typescript
interface AvailabilityException {
  startDate: string    // ISO 8601 DateTime (UTC)
  endDate: string      // ISO 8601 DateTime (UTC)
  isAllDay: boolean    // true = entire day, false = specific hours
  type: "unavailable" | "available"
  reason?: string      // Optional description
}
```

**Types:**
- **`unavailable`**: Hard block (vacation, sick day, meeting)
- **`available`**: Temporary override (extra shift, special hours)

**Example:**
```json
[
  {
    "startDate": "2026-02-10T00:00:00Z",
    "endDate": "2026-02-14T23:59:59Z",
    "isAllDay": true,
    "type": "unavailable",
    "reason": "Vacation"
  }
]
```

#### 4. Lesson Model (PostgreSQL via Prisma)
```typescript
model Lesson {
  id: string
  teacherId: string
  roomId?: string
  startAt: DateTime    // ISO 8601 (UTC)
  endAt: DateTime      // ISO 8601 (UTC)
  orgId: string
  // ... other fields
}
```

**Indexes on Lesson:**
- `@@index([orgId])`
- `@@index([teacherId])`
- `@@index([orgId, teacherId])` - composite for availability checks

### Availability Enforcement Logic

**CRITICAL - Evaluation Order:**

When checking if a lesson can be scheduled for a teacher:

1. **UNAVAILABLE exceptions** → Always blocks (highest priority)
   - If lesson overlaps with ANY unavailable exception, reject with `OUTSIDE_AVAILABILITY`

2. **AVAILABLE exceptions** → Allows time even outside weekly schedule
   - If lesson fits entirely within an available exception, allow

3. **Weekly availability** → Default constraint
   - If lesson fits within recurring weekly schedule, allow

4. **Otherwise** → Reject with `OUTSIDE_AVAILABILITY`

### API Behavior

**Conflict Detection:**
- `POST /api/lessons` returns **409 Conflict** if outside availability
- `PATCH /api/lessons/:id` returns **409 Conflict** if outside availability
- Response format:
  ```json
  {
    "error": "Conflict detected",
    "conflicts": {
      "availability": [
        {
          "type": "OUTSIDE_AVAILABILITY",
          "field": "teacher",
          "message": "Teacher is not available during this time",
          "reason": "Outside weekly availability"
        }
      ]
    }
  }
  ```

**Force Override:**
- Add header `x-force-create: true` (for POST) or `x-force-update: true` (for PATCH)
- Bypasses availability checks (but not double-booking checks)

### UI Components
- `AvailabilityEditor`: Weekly schedule grid editor
- `AvailabilityExceptionDialog`: Add/edit date exceptions
- `TeacherDialog`: Integrated availability management
- `AddLessonDialog`: Shows availability conflicts with resolution UI

## Layout System

- TopNav: 72px fixed header
- Sidebar: 240px fixed left
- Main: 12-column grid, 24px gaps

## Design System

- Primary color: `#F5A623` (gold)
- Background: `#0B0D10` (dark)
- Cards: Glass effect with blur
- Radius: 16px (cards), 12px (items)

## Conventions

### General
1. Use `'use client'` for interactive components
2. Import from barrel: `@/components/dashboard`
3. All data must be typed (TypeScript strict mode)
4. Use CSS variables for design tokens
5. Follow existing component patterns

### API & Database
6. Auth via headers: `x-user-role`, `x-user-id`, `x-org-id`
7. Prisma Json fields cast as `any` when writing (e.g., `weeklyAvailability as any`)
8. All timestamps in ISO 8601 format (UTC)
9. Conflict responses use 409 status with structured data
10. Force overrides via headers (`x-force-create`, `x-force-update`)

### Testing
11. Tests in `__tests__/` directories next to code
12. Use test helpers from `src/lib/test/db-helpers.ts`
13. Clean database before/after each test
14. Test coverage includes validation, conflicts, authorization

### Availability Rules
15. Unavailable exceptions always block (highest priority)
16. Available exceptions override weekly schedule
17. Weekly schedule is the default constraint
18. All times processed in UTC timezone
19. Lessons must fit entirely within available slots

### API Consistency (Phase 3-4 Standards)
20. **Error format**: `{ error: { code, message, details? } }` (all APIs)
21. **HTTP statuses**: 200, 201, 400, 403, 404, 409, 500 (standard across APIs)
22. **Pagination**: Default limit 20, max 100, structure: `{ data, pagination: { page, limit, total, totalPages, hasMore } }`
23. **Authorization patterns**:
    - Students: staff (GET/POST/PATCH), manager (DELETE)
    - Teachers: staff (GET), manager (POST/PATCH), admin (DELETE)
    - Groups: staff (GET), manager (POST/PATCH), admin (DELETE)
24. **OrgId isolation**: All endpoints filter/validate by user.orgId
25. **Duplicate detection**: Return 409 with DUPLICATE_EMAIL or DUPLICATE_NAME
26. **Validation**: Use Zod schemas (`create{Resource}Schema`, `update{Resource}Schema.partial()`)
27. **Enrichment** (optional): Add computed/related fields (e.g., lessonsToday, teacherName)