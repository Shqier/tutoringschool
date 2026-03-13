---
name: busala-database
description: Database operations for Busala School Management System using Prisma ORM and PostgreSQL. Use when working with database schema, migrations, queries, or data access patterns.
---

# Busala Database & Prisma

## Schema Location

```
prisma/schema.prisma
```

## Database Models

### Core Entities

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   // admin, manager, teacher, staff
  orgId     String   @default("org_busala_default")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Teacher {
  id                     String   @id @default(cuid())
  name                   String
  email                  String?
  phone                  String?
  orgId                  String
  weeklyAvailability     Json?    // Array of WeeklyAvailability
  availabilityExceptions Json?    // Array of AvailabilityException
  lessons                Lesson[]
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  @@index([orgId])
}

model Student {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  orgId       String
  groups      Group[]  // Many-to-many via _GroupToStudent
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([orgId])
}

model Group {
  id           String    @id @default(cuid())
  name         String
  orgId        String
  scheduleRule Json?     // ScheduleRule
  lessons      Lesson[]
  students     Student[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  @@index([orgId])
}

model Room {
  id        String   @id @default(cuid())
  name      String
  capacity  Int?
  orgId     String
  lessons   Lesson[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([orgId])
}

model Lesson {
  id          String   @id @default(cuid())
  title       String
  teacherId   String
  roomId      String
  groupId     String
  startTime   DateTime
  endTime     DateTime
  orgId       String
  status      String   @default("scheduled")
  teacher     Teacher  @relation(fields: [teacherId], references: [id])
  room        Room     @relation(fields: [roomId], references: [id])
  group       Group    @relation(fields: [groupId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([orgId])
  @@index([teacherId])
  @@index([roomId])
  @@index([groupId])
}
```

## JSON Type Definitions

```typescript
// src/lib/db/types.ts

interface WeeklyAvailability {
  dayOfWeek: number;      // 0-6 (Sunday-Saturday)
  startTime: string;      // "HH:MM"
  endTime: string;        // "HH:MM"
}

interface AvailabilityException {
  startDate: string;      // ISO 8601 DateTime
  endDate: string;        // ISO 8601 DateTime
  isAllDay: boolean;
  type: 'unavailable' | 'available';
  reason?: string;
}

interface ScheduleRule {
  recurrence: 'weekly' | 'biweekly';
  dayOfWeek: number;
  startTime: string;
  duration: number;       // Minutes
}
```

## Prisma Client

### Singleton Pattern

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

## Common Queries

### Create with Relations

```typescript
const lesson = await prisma.lesson.create({
  data: {
    title: 'Math Class',
    teacherId: teacher.id,
    roomId: room.id,
    groupId: group.id,
    startTime: new Date('2024-01-15T09:00:00Z'),
    endTime: new Date('2024-01-15T10:00:00Z'),
    orgId: user.orgId,
  },
  include: {
    teacher: true,
    room: true,
    group: { include: { students: true } },
  },
});
```

### Query with Pagination

```typescript
const [items, total] = await Promise.all([
  prisma.teacher.findMany({
    where: { orgId: user.orgId },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.teacher.count({ where: { orgId: user.orgId } }),
]);
```

### Update JSON Field

```typescript
const teacher = await prisma.teacher.update({
  where: { id: teacherId },
  data: {
    weeklyAvailability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    ],
  },
});
```

### Transaction

```typescript
const [student, updatedGroups] = await prisma.$transaction([
  prisma.student.create({
    data: {
      name: 'John Doe',
      orgId: user.orgId,
      groups: { connect: groupIds.map(id => ({ id })) },
    },
  }),
  prisma.group.findMany({
    where: { id: { in: groupIds } },
  }),
]);
```

### Search with Filters

```typescript
const teachers = await prisma.teacher.findMany({
  where: {
    orgId: user.orgId,
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  },
});
```

## Migrations

### Create Migration

```bash
npx prisma migrate dev --name add_lesson_status
```

### Deploy Migrations

```bash
npx prisma migrate deploy
```

### Reset Database

```bash
npx prisma migrate reset
```

## Database Commands

```bash
# Open Prisma Studio
npx prisma studio

# Generate client (after schema changes)
npx prisma generate

# Pull schema from existing database
npx prisma db pull

# Push schema (dev only, no migrations)
npx prisma db push

# Seed database
npx prisma db seed
```

## Environment Variables

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/busala?schema=public"
```

## Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: 'admin@busala.com',
      name: 'Admin User',
      role: 'admin',
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Best Practices

1. Always use orgId in WHERE clauses for multi-tenancy
2. Include related data only when needed
3. Use transactions for multi-table operations
4. Index frequently queried fields
5. Use $transaction for batch operations
6. Handle unique constraint violations (P2002)
7. Handle record not found (P2025)
8. Use select/include sparingly for performance
9. Cache client in development with singleton pattern
10. Type JSON fields with TypeScript interfaces
