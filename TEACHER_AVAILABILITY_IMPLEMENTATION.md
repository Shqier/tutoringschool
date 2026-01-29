# Teacher Availability Enforcement - Implementation Summary

## Overview
Implemented comprehensive teacher availability enforcement system that checks both weekly schedules and date-based exceptions when creating or updating lessons.

## Implementation Status: COMPLETE

All components have been implemented and tested successfully.

## Components Implemented

### 1. Database Schema
**File**: `/Users/shqier/Desktop/Dev/busala-v1/prisma/schema.prisma`

Added `availabilityExceptions` field to Teacher model:
```prisma
availabilityExceptions  Json               @default("[]") // AvailabilityException[]
```

Migration: `20260128144538_add_availability_exceptions` (already applied)

### 2. TypeScript Types
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/lib/db/types.ts`

Added `AvailabilityException` interface:
```typescript
export interface AvailabilityException {
  id: string;                     // UUID
  type: 'unavailable' | 'available';  // Block time or override weekly absence
  startDate: string;              // YYYY-MM-DD
  endDate: string;                // YYYY-MM-DD
  reason?: string;                // Optional description
  allDay: boolean;                // Full day or specific hours
  startTime?: string;             // HH:mm (if !allDay)
  endTime?: string;               // HH:mm (if !allDay)
}
```

### 3. Validation Schemas
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/lib/validators/schemas.ts`

Added `availabilityExceptionSchema` with comprehensive validation:
- UUID format validation
- Date format validation (YYYY-MM-DD)
- Time format validation (HH:mm)
- Cross-field validation (endDate >= startDate)
- Conditional validation (startTime/endTime required when allDay is false)

Updated `createTeacherSchema` to include `availabilityExceptions` field.

### 4. Availability Checking Logic
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/lib/scheduling/teacher-availability.ts`

Implemented `checkTeacherAvailability()` function with three-phase checking:

1. **Phase 1: Unavailable Exceptions** - Blocks time first (highest priority)
   - All-day blocks: Teacher completely unavailable
   - Time-specific blocks: Teacher unavailable during specific hours

2. **Phase 2: Available Override Exceptions** - Allow overrides
   - All-day overrides: Teacher available entire day
   - Time-specific overrides: Teacher available during specific hours

3. **Phase 3: Weekly Availability** - Regular schedule
   - Checks if lesson falls within weekly availability slots
   - Lesson must be fully contained within slot (start >= slot.start && end <= slot.end)

**Key Features**:
- Uses UTC time consistently to avoid timezone issues
- Multi-day exception support
- Detailed reason messages for unavailability
- Efficient date/time comparison logic

### 5. Conflict Detection Integration
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/lib/scheduling/conflicts.ts`

Updated `checkAllConflicts()` to include availability checking:
```typescript
export async function checkAllConflicts(
  teacherId: string,
  roomId: string | undefined,
  startAt: string,
  endAt: string,
  excludeLessonId?: string
): Promise<{
  teacherConflicts: Lesson[];
  roomConflicts: Lesson[];
  availabilityViolation?: string;  // NEW
  hasConflicts: boolean;
}> {
  // ... existing conflict checks ...

  // Check teacher availability
  const availabilityCheck = await checkTeacherAvailability(teacherId, startAt, endAt);
  const availabilityViolation = availabilityCheck.isAvailable ? undefined : availabilityCheck.reason;

  return {
    teacherConflicts,
    roomConflicts,
    availabilityViolation,
    hasConflicts: teacherConflicts.length > 0 || roomConflicts.length > 0 || !!availabilityViolation,
  };
}
```

### 6. Lesson Creation API (POST)
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/app/api/lessons/route.ts`

Updated conflict response to include availability violations:
```typescript
if (conflictCheck.hasConflicts && !forceCreate) {
  return jsonResponse({
    success: false,
    conflicts: {
      teacher: [...],
      room: [...],
      availability: conflictCheck.availabilityViolation ? [conflictCheck.availabilityViolation] : undefined,
    },
    message: 'Schedule conflicts detected. Set x-force-create header to true to override.',
  }, 409);
}
```

**Force Override**: Supports `x-force-create: true` header to bypass availability checks.

### 7. Lesson Update API (PATCH)
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/app/api/lessons/[id]/route.ts`

Updated with same availability enforcement as POST endpoint.
**Force Override**: Supports `x-force-update: true` header.

### 8. Teacher Update API (PATCH)
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/app/api/teachers/[id]/route.ts`

Updated to handle `availabilityExceptions` field:
```typescript
const updated = await prisma.teacher.update({
  where: { id },
  data: {
    ...parsed.data,
    weeklyAvailability: parsed.data.weeklyAvailability as any,
    availabilityExceptions: parsed.data.availabilityExceptions as any,  // NEW
  },
});
```

## Test Coverage

### Unit Tests
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/lib/scheduling/__tests__/teacher-availability.test.ts`

7 comprehensive tests covering:
- Weekly availability matching
- Weekly availability violations
- Time boundary checking
- All-day unavailable exceptions
- Time-specific unavailable exceptions
- Available override exceptions
- Multi-day vacation blocks

### Integration Tests
**File**: `/Users/shqier/Desktop/Dev/busala-v1/src/app/api/lessons/__tests__/route.test.ts`

4 availability enforcement tests:
- Rejection due to weekly schedule violation
- Rejection due to unavailable exception
- Force-create override functionality
- Available override exception functionality

**Test Results**: All 70 tests passing

## API Response Format

### Conflict Response (409)
```json
{
  "success": false,
  "conflicts": {
    "teacher": [
      {
        "id": "lesson-uuid",
        "title": "Existing Lesson",
        "startAt": "2026-02-02T10:00:00Z",
        "endAt": "2026-02-02T11:00:00Z"
      }
    ],
    "room": [...],
    "availability": [
      "Teacher unavailable: Vacation"
    ]
  },
  "message": "Schedule conflicts detected. Set x-force-create header to true to override."
}
```

## Usage Examples

### 1. Create Teacher with Availability Exceptions
```bash
POST /api/teachers
Content-Type: application/json

{
  "fullName": "John Smith",
  "email": "john@example.com",
  "subjects": ["Arabic", "Islamic Studies"],
  "weeklyAvailability": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00" }
  ],
  "availabilityExceptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "unavailable",
      "startDate": "2026-02-10",
      "endDate": "2026-02-14",
      "reason": "Winter vacation",
      "allDay": true
    }
  ]
}
```

### 2. Update Teacher Availability
```bash
PATCH /api/teachers/{id}
Content-Type: application/json

{
  "availabilityExceptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "available",
      "startDate": "2026-02-20",
      "endDate": "2026-02-20",
      "reason": "Extra shift for makeup classes",
      "allDay": true
    }
  ]
}
```

### 3. Create Lesson (Auto-checked)
```bash
POST /api/lessons
Content-Type: application/json

{
  "title": "Arabic Grammar",
  "startAt": "2026-02-11T10:00:00Z",
  "endAt": "2026-02-11T11:00:00Z",
  "type": "one_on_one",
  "teacherId": "teacher-uuid",
  "studentId": "student-uuid"
}

# Response: 409 Conflict
{
  "success": false,
  "conflicts": {
    "availability": ["Teacher unavailable: Winter vacation"]
  }
}
```

### 4. Force Create Lesson (Override)
```bash
POST /api/lessons
Content-Type: application/json
x-force-create: true

{
  "title": "Arabic Grammar",
  "startAt": "2026-02-11T10:00:00Z",
  "endAt": "2026-02-11T11:00:00Z",
  "type": "one_on_one",
  "teacherId": "teacher-uuid",
  "studentId": "student-uuid"
}

# Response: 201 Created
```

## Availability Checking Logic

### Priority Order
1. **Unavailable Exceptions** (highest priority)
   - If lesson overlaps with unavailable exception → REJECT
2. **Available Override Exceptions**
   - If lesson overlaps with available exception → ALLOW
3. **Weekly Availability Schedule**
   - If lesson is within weekly slot → ALLOW
   - Otherwise → REJECT

### Time Comparison Rules
- All times are processed in UTC
- Weekly slots: Lesson must be fully contained (start >= slot.start AND end <= slot.end)
- Exceptions: Any overlap blocks or allows time
- Multi-day exceptions: Checked by date range

## Database Migration

Already applied:
```bash
npx prisma migrate deploy
npx prisma generate
```

Migration file: `/Users/shqier/Desktop/Dev/busala-v1/prisma/migrations/20260128144538_add_availability_exceptions/`

## Error Codes

- `INVALID_TEACHER` - Teacher not found
- `INVALID_ROOM` - Room not found
- `ROOM_UNAVAILABLE` - Room in maintenance
- `INVALID_GROUP` - Group not found
- `INVALID_STUDENT` - Student not found
- `DUPLICATE_EMAIL` - Email already exists
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed

Conflict responses use status code 409 with detailed conflict information.

## Security & Permissions

- **Create Lesson**: Requires `teacher` role or higher
- **Update Lesson**: Requires `teacher` role or higher
- **Update Teacher**: Requires `manager` role or higher
- **Force Override**: Available to all users with create/update permissions (business decision to allow any authorized user to override)

## Performance Considerations

- Availability checks run for every lesson create/update
- Single database query per teacher to fetch availability data
- In-memory processing of availability rules
- No additional database queries for exception checking
- Efficient date/time comparison using native Date objects

## Future Enhancements

Potential improvements for future iterations:
1. Recurring exceptions (e.g., "every Friday unavailable")
2. Partial day exceptions with multiple time blocks
3. Availability templates for common patterns
4. Bulk availability updates
5. Availability conflict preview API endpoint
6. Calendar integration (iCal export)
7. Notification system for availability changes
8. Availability analytics and reporting

## Files Modified

1. `/Users/shqier/Desktop/Dev/busala-v1/prisma/schema.prisma` - Added field (already done)
2. `/Users/shqier/Desktop/Dev/busala-v1/src/lib/db/types.ts` - Added interface (already done)
3. `/Users/shqier/Desktop/Dev/busala-v1/src/lib/validators/schemas.ts` - Added schema (already done)
4. `/Users/shqier/Desktop/Dev/busala-v1/src/lib/scheduling/teacher-availability.ts` - Created (already done)
5. `/Users/shqier/Desktop/Dev/busala-v1/src/lib/scheduling/conflicts.ts` - Updated (already done)
6. `/Users/shqier/Desktop/Dev/busala-v1/src/app/api/lessons/route.ts` - Updated (already done)
7. `/Users/shqier/Desktop/Dev/busala-v1/src/app/api/lessons/[id]/route.ts` - Updated (already done)
8. `/Users/shqier/Desktop/Dev/busala-v1/src/app/api/teachers/[id]/route.ts` - Updated (just completed)

## Files Created

1. `/Users/shqier/Desktop/Dev/busala-v1/src/lib/scheduling/teacher-availability.ts` - Core logic (already done)
2. `/Users/shqier/Desktop/Dev/busala-v1/src/lib/scheduling/__tests__/teacher-availability.test.ts` - Unit tests (already done)

## Verification Checklist

- [x] Database migration applied successfully
- [x] TypeScript types defined
- [x] Validation schemas created
- [x] Availability checking logic implemented
- [x] Conflict detection integrated
- [x] POST /api/lessons updated
- [x] PATCH /api/lessons/[id] updated
- [x] PATCH /api/teachers/[id] updated
- [x] Unit tests passing (7/7)
- [x] Integration tests passing (36/36 lessons + 27/27 lesson updates)
- [x] All tests passing (70/70)
- [x] Force override headers working
- [x] Error messages descriptive
- [x] UTC timezone handling correct

## Status: PRODUCTION READY

All requirements met. System is fully functional and tested.
