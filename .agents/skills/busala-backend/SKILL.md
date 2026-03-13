---
name: busala-backend
description: Backend development for Busala School Management System using Next.js API routes, Prisma ORM, and PostgreSQL. Use when creating or modifying API endpoints, database queries, or business logic. Covers REST API patterns, authentication, authorization, and database operations.
---

# Busala Backend Development

## Tech Stack

- **Runtime**: Node.js (Next.js API routes)
- **ORM**: Prisma 7.3.0
- **Database**: PostgreSQL 14+
- **Language**: TypeScript 5 (strict mode)

## API Route Structure

```
src/app/api/
├── teachers/
│   ├── route.ts          # GET /api/teachers, POST /api/teachers
│   └── [id]/
│       └── route.ts      # GET /api/teachers/[id], PATCH, DELETE
├── students/
├── groups/
├── lessons/
├── rooms/
└── approvals/
```

## Route Handler Pattern

```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { 
  jsonResponse, 
  errorResponse, 
  requireRole,
  getUserFromRequest 
} from '@/lib/api-utils';

// GET /api/resource
export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    // Get data
    const items = await prisma.resource.findMany({
      where: { orgId: user.orgId },
    });

    return jsonResponse(items);
  } catch (error) {
    console.error('GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch', 500);
  }
}

// POST /api/resource
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const body = await request.json();
    
    // Validate with Zod
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const item = await prisma.resource.create({
      data: {
        ...result.data,
        orgId: user.orgId,
      },
    });

    return jsonResponse(item, 201);
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 'Failed to create', 500);
  }
}
```

## Database Patterns

### Prisma Client

```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Common Queries

```typescript
// Find with relations
const teacher = await prisma.teacher.findUnique({
  where: { id },
  include: { lessons: true, groups: true },
});

// Create with nested data
const group = await prisma.group.create({
  data: {
    name: 'Group A',
    teacher: { connect: { id: teacherId } },
    students: { connect: studentIds.map(id => ({ id })) },
  },
});

// Update
const updated = await prisma.teacher.update({
  where: { id },
  data: { name: 'New Name' },
});

// Soft delete (update status)
await prisma.teacher.update({
  where: { id },
  data: { status: 'inactive' },
});
```

## Authentication & Authorization

### Require Role

```typescript
const { authorized, user, errorResponse } = requireRole(request, 'manager');
if (!authorized) return errorResponse;
```

### Role Hierarchy

- `admin` - Full access (DELETE operations)
- `manager` - Create, update resources
- `teacher` - View own data, manage availability
- `staff` - Read access only

### Get User from Request

```typescript
const user = getUserFromRequest(request);
// Returns: { id, role, orgId, email }
```

## Response Formats

### Success (200)

```json
{ "id": "...", "name": "..." }
```

### Success with Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

### Error (400/403/404/409/500)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [...]
  }
}
```

## Testing API Routes

```typescript
// src/app/api/teachers/__tests__/route.test.ts
import { prisma } from '@/lib/db/prisma';
import { cleanDatabase, createTestTeacher } from '@/lib/test/db-helpers';

describe('GET /api/teachers', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns teachers for org', async () => {
    await createTestTeacher();
    
    const response = await GET(createTestRequest());
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });
});
```

## Conflict Detection

```typescript
import { checkAllConflicts } from '@/lib/scheduling/conflicts';

const conflicts = await checkAllConflicts({
  teacherId,
  roomId,
  startAt,
  endAt,
  orgId,
});

if (conflicts.length > 0) {
  return jsonResponse(
    { error: 'Conflict detected', conflicts },
    409
  );
}
```

## Best Practices

1. Always filter by `orgId` for multi-tenancy
2. Use `requireRole()` for authorization
3. Validate all inputs with Zod
4. Return proper HTTP status codes
5. Log errors with console.error
6. Use transactions for multi-step operations
7. Add database indexes for performance
