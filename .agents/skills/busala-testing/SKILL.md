---
name: busala-testing
description: Testing for Busala School Management System using Vitest and React Testing Library. Use when writing unit tests, integration tests for API routes, or testing components.
---

# Busala Testing Guide

## Test Framework

- **Runner**: Vitest
- **DOM**: happy-dom
- **Components**: @testing-library/react
- **Coverage**: @vitest/coverage-v8

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    fileParallelism: false, // Database tests run sequentially
    setupFiles: ['./src/lib/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Test File Locations

```
src/app/api/teachers/__tests__/route.test.ts
src/app/api/teachers/__tests__/[id].route.test.ts
src/lib/scheduling/__tests__/conflicts.test.ts
src/components/__tests__/MyComponent.test.tsx
```

## Test Setup

```typescript
// src/lib/test/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});
```

## Test Helpers

```typescript
// src/lib/test/db-helpers.ts
import { prisma } from '@/lib/db/prisma';

export async function cleanDatabase() {
  const tablenames = ['Lesson', 'Group', 'Student', 'Teacher', 'Room', 'User'];
  for (const name of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${name}" CASCADE;`);
  }
}

export async function createTestTeacher(data: Partial<Teacher> = {}) {
  return prisma.teacher.create({
    data: {
      name: 'Test Teacher',
      email: 'teacher@test.com',
      orgId: 'org_test',
      ...data,
    },
  });
}

export async function createTestRoom(data: Partial<Room> = {}) {
  return prisma.room.create({
    data: {
      name: 'Test Room',
      capacity: 20,
      orgId: 'org_test',
      ...data,
    },
  });
}

export async function createTestGroup(data: Partial<Group> = {}) {
  return prisma.group.create({
    data: {
      name: 'Test Group',
      orgId: 'org_test',
      ...data,
    },
  });
}

export async function createTestStudent(data: Partial<Student> = {}) {
  return prisma.student.create({
    data: {
      name: 'Test Student',
      orgId: 'org_test',
      ...data,
    },
  });
}

export async function createTestLesson(data: Partial<Lesson> = {}) {
  return prisma.lesson.create({
    data: {
      title: 'Test Lesson',
      startTime: new Date('2024-01-15T09:00:00Z'),
      endTime: new Date('2024-01-15T10:00:00Z'),
      orgId: 'org_test',
      ...data,
    },
  });
}

export function createTestHeaders(role = 'admin') {
  return {
    'x-user-id': 'test-user',
    'x-user-role': role,
    'x-org-id': 'org_test',
  };
}
```

## API Route Testing

```typescript
// src/app/api/teachers/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET, POST } from '../route';
import { createTestTeacher, createTestHeaders, cleanDatabase } from '@/lib/test/db-helpers';

describe('GET /api/teachers', () => {
  it('returns empty list when no teachers', async () => {
    await cleanDatabase();
    const request = new Request('http://localhost:3000/api/teachers', {
      headers: createTestHeaders(),
    });
    
    const response = await GET(request);
    const body = await response.json();
    
    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });
  
  it('returns paginated list of teachers', async () => {
    await cleanDatabase();
    await Promise.all([
      createTestTeacher({ name: 'Teacher 1' }),
      createTestTeacher({ name: 'Teacher 2' }),
    ]);
    
    const request = new Request('http://localhost:3000/api/teachers?page=1&limit=10', {
      headers: createTestHeaders(),
    });
    
    const response = await GET(request);
    const body = await response.json();
    
    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(2);
  });
  
  it('filters by search term', async () => {
    await cleanDatabase();
    await Promise.all([
      createTestTeacher({ name: 'John Doe' }),
      createTestTeacher({ name: 'Jane Smith' }),
    ]);
    
    const request = new Request('http://localhost:3000/api/teachers?search=john', {
      headers: createTestHeaders(),
    });
    
    const response = await GET(request);
    const body = await response.json();
    
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('John Doe');
  });
});

describe('POST /api/teachers', () => {
  it('creates a new teacher', async () => {
    await cleanDatabase();
    const request = new Request('http://localhost:3000/api/teachers', {
      method: 'POST',
      headers: {
        ...createTestHeaders('manager'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Teacher',
        email: 'new@teacher.com',
      }),
    });
    
    const response = await POST(request);
    const body = await response.json();
    
    expect(response.status).toBe(201);
    expect(body.name).toBe('New Teacher');
  });
  
  it('rejects unauthorized users', async () => {
    const request = new Request('http://localhost:3000/api/teachers', {
      method: 'POST',
      headers: {
        ...createTestHeaders('staff'), // Staff can't create
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Teacher' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
  
  it('validates required fields', async () => {
    await cleanDatabase();
    const request = new Request('http://localhost:3000/api/teachers', {
      method: 'POST',
      headers: {
        ...createTestHeaders('manager'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Missing name
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

## Component Testing

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
  
  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Integration Testing

```typescript
// Test scheduling conflicts
import { describe, it, expect } from 'vitest';
import { checkConflicts } from '@/lib/scheduling/conflicts';
import { createTestTeacher, createTestRoom, createTestLesson } from '@/lib/test/db-helpers';

describe('Scheduling Conflicts', () => {
  it('detects teacher conflicts', async () => {
    const teacher = await createTestTeacher();
    const room = await createTestRoom();
    
    // Create existing lesson
    await createTestLesson({
      teacherId: teacher.id,
      roomId: room.id,
      startTime: new Date('2024-01-15T09:00:00Z'),
      endTime: new Date('2024-01-15T10:00:00Z'),
    });
    
    // Check for conflict
    const conflicts = await checkConflicts({
      teacherId: teacher.id,
      roomId: room.id,
      startTime: new Date('2024-01-15T09:30:00Z'), // Overlaps
      endTime: new Date('2024-01-15T10:30:00Z'),
    });
    
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('teacher');
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific file
npx vitest src/app/api/teachers/__tests__/route.test.ts
```

## Test Conventions

1. Use descriptive test names
2. One assertion per logical check
3. Clean database in beforeEach
4. Use test helpers for common operations
5. Test happy path and error cases
6. Test authorization separately
7. Use consistent orgId for isolation
8. Mock external services

## Common Matchers

```typescript
// Equality
expect(value).toBe(expected);      // strict equality
expect(value).toEqual(expected);   // deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeGreaterThanOrEqual(5);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', 'value');

// Functions
const fn = vi.fn();
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(1);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// DOM (with @testing-library/jest-dom)
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent('text');
expect(element).toHaveClass('class-name');
expect(element).toBeDisabled();
```

## Best Practices

1. Run tests sequentially for database tests
2. Clean database before each test
3. Use descriptive test names
4. Test both success and failure cases
5. Mock external dependencies
6. Keep tests independent
7. Use factories/helpers for test data
8. Test edge cases (empty, max values)
