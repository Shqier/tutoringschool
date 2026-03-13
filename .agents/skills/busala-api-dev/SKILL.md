---
name: busala-api-dev
description: API development for Busala School Management System. Use when creating or modifying REST API routes, handling CRUD operations, validation, error handling, or implementing business logic like scheduling conflicts.
---

# Busala API Development

## Route Structure

```
src/app/api/
├── teachers/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       └── route.ts       # GET (single), PATCH, DELETE
├── students/
│   ├── route.ts
│   └── [id]/route.ts
├── groups/
│   ├── route.ts
│   └── [id]/route.ts
├── rooms/
│   ├── route.ts
│   └── [id]/route.ts
├── lessons/
│   ├── route.ts
│   └── [id]/route.ts
├── scheduling/
│   └── route.ts           # Scheduling-specific endpoints
└── me/
    └── route.ts           # Current user info
```

## Route Handler Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole, getUserFromRequest } from '@/lib/api-utils';

// Validation schema
const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// GET /api/resource
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    const [data, total] = await Promise.all([
      prisma.resource.findMany({
        where: { orgId: user.orgId },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where: { orgId: user.orgId } }),
    ]);
    
    return jsonResponse({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/resource error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch resources', 500);
  }
}

// POST /api/resource
export async function POST(request: NextRequest) {
  const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
  if (!authorized) return authError;
  
  try {
    const body = await request.json();
    const validated = createSchema.parse(body);
    
    const resource = await prisma.resource.create({
      data: {
        ...validated,
        orgId: user.orgId,
      },
    });
    
    return jsonResponse(resource, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors[0].message, 400);
    }
    console.error('POST /api/resource error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create resource', 500);
  }
}
```

## Error Response Format

```typescript
// Standard error response
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": [/* optional additional info */]
  }
}

// Common error codes
NOT_FOUND           // Resource doesn't exist
VALIDATION_ERROR    // Invalid input data
UNAUTHORIZED        // Not authenticated
FORBIDDEN           // Insufficient permissions
CONFLICT            // Resource already exists or scheduling conflict
INTERNAL_ERROR      // Server error
```

## Pagination

```typescript
// Request
GET /api/teachers?page=2&limit=50

// Response
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 127,
    "totalPages": 3,
    "hasMore": true
  }
}
```

## Filtering

```typescript
// Query parameters
GET /api/lessons?teacherId=123&startDate=2024-01-01&endDate=2024-01-31

// Implementation
const teacherId = searchParams.get('teacherId');
const startDate = searchParams.get('startDate');

const where: Prisma.LessonWhereInput = {
  orgId: user.orgId,
  ...(teacherId && { teacherId }),
  ...(startDate && endDate && {
    startTime: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  }),
};
```

## CRUD Patterns

### List with Search

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  
  const where = {
    orgId: user.orgId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  
  // ... query with where
}
```

### Get Single

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request);
  
  const resource = await prisma.resource.findFirst({
    where: {
      id: params.id,
      orgId: user.orgId,
    },
  });
  
  if (!resource) {
    return errorResponse('NOT_FOUND', 'Resource not found', 404);
  }
  
  return jsonResponse(resource);
}
```

### Update (PATCH)

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized, errorResponse: authError } = requireRole(request, 'manager');
  if (!authorized) return authError;
  
  try {
    const body = await request.json();
    const validated = updateSchema.parse(body);
    
    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: validated,
    });
    
    return jsonResponse(resource);
  } catch (error) {
    if (error.code === 'P2025') {
      return errorResponse('NOT_FOUND', 'Resource not found', 404);
    }
    throw error;
  }
}
```

### Delete

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized, errorResponse: authError } = requireRole(request, 'admin');
  if (!authorized) return authError;
  
  try {
    await prisma.resource.delete({
      where: { id: params.id },
    });
    
    return jsonResponse({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return errorResponse('NOT_FOUND', 'Resource not found', 404);
    }
    throw error;
  }
}
```

## Scheduling Conflicts

```typescript
import { checkConflicts } from '@/lib/scheduling/conflicts';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Check for conflicts
  const conflicts = await checkConflicts({
    teacherId: body.teacherId,
    roomId: body.roomId,
    startTime: new Date(body.startTime),
    endTime: new Date(body.endTime),
    excludeLessonId: body.excludeId, // For updates
  });
  
  if (conflicts.length > 0) {
    return jsonResponse(
      { error: 'Conflict detected', conflicts },
      409
    );
  }
  
  // Create lesson
  const lesson = await prisma.lesson.create({ data: body });
  return jsonResponse(lesson, 201);
}
```

## API Utilities

### jsonResponse

```typescript
function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
```

### errorResponse

```typescript
function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}
```

### requireRole

```typescript
function requireRole(request: NextRequest, minimumRole: UserRole) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return {
      authorized: false,
      errorResponse: errorResponse('UNAUTHORIZED', 'Authentication required', 401),
    };
  }
  
  const roleHierarchy = { staff: 1, teacher: 2, manager: 3, admin: 4 };
  if (roleHierarchy[user.role] < roleHierarchy[minimumRole]) {
    return {
      authorized: false,
      errorResponse: errorResponse('FORBIDDEN', 'Insufficient permissions', 403),
    };
  }
  
  return { authorized: true, user };
}
```

## Best Practices

1. Always validate input with Zod
2. Check authentication on all routes
3. Check authorization for write operations
4. Use orgId isolation for all queries
5. Handle Prisma errors (P2025 = not found)
6. Return consistent error formats
7. Log errors with context
8. Use pagination for list endpoints
9. Support filtering and search
10. Check scheduling conflicts for lessons
