# Busala API Documentation

Complete API reference for the Busala school management system.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All API requests require these headers:

```http
x-user-id: <uuid>
x-user-role: staff | manager | admin
x-org-id: <uuid>
```

### Role Permissions

| Role | Students | Teachers | Groups | Lessons |
|------|----------|----------|--------|---------|
| **staff** | GET, POST, PATCH | GET | GET | GET, POST, PATCH, DELETE |
| **manager** | + DELETE | + POST, PATCH | + POST, PATCH | All |
| **admin** | All | + DELETE | + DELETE | All |

## Common Patterns

### Pagination

All list endpoints support pagination:

```http
GET /api/students?page=1&limit=20
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

### Search & Filters

Most list endpoints support search and filtering:

```http
GET /api/students?search=john&status=active&groupId=abc123
```

### Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_EMAIL` - Email already exists
- `DUPLICATE_NAME` - Name already exists
- `CONFLICT` - Scheduling or resource conflict
- `OUTSIDE_AVAILABILITY` - Teacher not available

## API Endpoints

---

## Students API

### List Students

```http
GET /api/students
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search by name
- `status` - Filter by enrollment status (active, pending, inactive)
- `groupId` - Filter by group

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Ahmed Al-Rahman",
      "email": "ahmed@example.com",
      "phone": "+1234567890",
      "groupId": "uuid",
      "group": {
        "id": "uuid",
        "name": "Arabic Beginners A1"
      },
      "enrollmentStatus": "active",
      "orgId": "uuid",
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

### Create Student

```http
POST /api/students
```

**Required Role:** staff

**Request Body:**
```json
{
  "fullName": "Ahmed Al-Rahman",
  "email": "ahmed@example.com",
  "phone": "+1234567890",
  "groupId": "uuid",
  "enrollmentStatus": "active"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "fullName": "Ahmed Al-Rahman",
  ...
}
```

**Errors:**
- `400` - Validation error
- `403` - Insufficient permissions
- `409` - Duplicate email

### Get Student

```http
GET /api/students/:id
```

**Response:** `200 OK`

**Errors:**
- `404` - Student not found

### Update Student

```http
PATCH /api/students/:id
```

**Required Role:** staff

**Request Body:** (all fields optional)
```json
{
  "fullName": "Ahmed Al-Rahman",
  "email": "new@example.com",
  "phone": "+9876543210",
  "groupId": "new-uuid",
  "enrollmentStatus": "inactive"
}
```

**Response:** `200 OK`

**Errors:**
- `400` - Validation error
- `403` - Insufficient permissions
- `404` - Student not found
- `409` - Duplicate email

### Delete Student

```http
DELETE /api/students/:id
```

**Required Role:** manager

**Response:** `200 OK`
```json
{
  "message": "Student deleted successfully"
}
```

**Errors:**
- `403` - Insufficient permissions
- `404` - Student not found

---

## Teachers API

### List Teachers

```http
GET /api/teachers
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search by name
- `status` - Filter by status (active, inactive, on_leave)
- `specialization` - Filter by subject specialization

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Fatima Ali",
      "email": "fatima@example.com",
      "phone": "+1234567890",
      "specialization": "Arabic Language",
      "status": "active",
      "weeklyAvailability": [
        {
          "dayOfWeek": 1,
          "startTime": "09:00",
          "endTime": "17:00"
        }
      ],
      "availabilityExceptions": [],
      "lessonsToday": 3,
      "orgId": "uuid",
      "createdAt": "2026-01-10T08:00:00Z",
      "updatedAt": "2026-01-10T08:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Create Teacher

```http
POST /api/teachers
```

**Required Role:** manager

**Request Body:**
```json
{
  "fullName": "Fatima Ali",
  "email": "fatima@example.com",
  "phone": "+1234567890",
  "specialization": "Arabic Language",
  "status": "active",
  "weeklyAvailability": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ]
}
```

**Weekly Availability:**
- `dayOfWeek`: 0-6 (0=Sunday, 6=Saturday)
- `startTime`, `endTime`: "HH:MM" format (24-hour)

**Response:** `201 Created`

### Update Teacher Availability

```http
PATCH /api/teachers/:id
```

**Request Body:**
```json
{
  "weeklyAvailability": [...],
  "availabilityExceptions": [
    {
      "startDate": "2026-02-10T00:00:00Z",
      "endDate": "2026-02-14T23:59:59Z",
      "isAllDay": true,
      "type": "unavailable",
      "reason": "Vacation"
    }
  ]
}
```

**Exception Types:**
- `unavailable` - Teacher cannot work (vacation, sick day)
- `available` - Override to work outside normal schedule

---

## Groups API

### List Groups

```http
GET /api/groups
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `search` - Search by name
- `level` - Filter by level (A1, A2, B1, B2)
- `status` - Filter by status (active, inactive, completed)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Arabic Beginners A1",
      "level": "A1",
      "capacity": 15,
      "currentEnrollment": 12,
      "status": "active",
      "lessonsCount": 24,
      "orgId": "uuid"
    }
  ],
  "pagination": {...}
}
```

### Create Group

```http
POST /api/groups
```

**Required Role:** manager

**Request Body:**
```json
{
  "name": "Arabic Beginners A1",
  "level": "A1",
  "capacity": 15,
  "status": "active"
}
```

---

## Lessons API

### List Lessons

```http
GET /api/lessons
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `teacherId` - Filter by teacher
- `groupId` - Filter by group
- `roomId` - Filter by room
- `status` - Filter by status (scheduled, in_progress, completed, cancelled)
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Arabic Grammar Introduction",
      "teacherId": "uuid",
      "teacher": {
        "id": "uuid",
        "fullName": "Fatima Ali"
      },
      "groupId": "uuid",
      "group": {
        "id": "uuid",
        "name": "Arabic Beginners A1"
      },
      "roomId": "uuid",
      "room": {
        "id": "uuid",
        "name": "Room 101"
      },
      "startAt": "2026-02-08T10:00:00Z",
      "endAt": "2026-02-08T11:30:00Z",
      "status": "scheduled",
      "notes": "",
      "orgId": "uuid"
    }
  ],
  "pagination": {...}
}
```

### Create Lesson

```http
POST /api/lessons
```

**Request Body:**
```json
{
  "title": "Arabic Grammar Introduction",
  "teacherId": "uuid",
  "groupId": "uuid",
  "roomId": "uuid",
  "startAt": "2026-02-08T10:00:00Z",
  "endAt": "2026-02-08T11:30:00Z",
  "status": "scheduled",
  "notes": "Bring textbooks"
}
```

**Conflict Detection:**

The API automatically checks for:
1. Teacher double-booking
2. Room double-booking
3. Teacher availability

**Response on Conflict:** `409 Conflict`
```json
{
  "error": "Conflict detected",
  "conflicts": {
    "teacher": [
      {
        "type": "DOUBLE_BOOKING",
        "field": "teacher",
        "message": "Teacher is already booked",
        "existingLesson": {...}
      }
    ],
    "room": [],
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

To bypass double-booking conflicts (but NOT availability):

```http
POST /api/lessons
x-force-create: true
```

**Success Response:** `201 Created`

### Update Lesson

```http
PATCH /api/lessons/:id
```

**Request Body:** (all fields optional)
```json
{
  "title": "New title",
  "startAt": "2026-02-08T11:00:00Z",
  "endAt": "2026-02-08T12:30:00Z",
  "status": "completed"
}
```

**Force Override:**
```http
PATCH /api/lessons/:id
x-force-update: true
```

### Delete Lesson

```http
DELETE /api/lessons/:id
```

**Response:** `200 OK`

---

## Rooms API

### List Rooms

```http
GET /api/rooms
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Room 101",
      "capacity": 20,
      "type": "classroom",
      "status": "available",
      "orgId": "uuid"
    }
  ]
}
```

---

## Approvals API

### List Pending Approvals

```http
GET /api/approvals?status=pending
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "lesson_change",
      "entityId": "uuid",
      "status": "pending",
      "requestedBy": "uuid",
      "requestedAt": "2026-02-08T09:00:00Z"
    }
  ]
}
```

---

## Webhooks (Future)

Webhook support is planned for:
- Lesson created/updated/deleted
- Student enrolled/withdrawn
- Teacher availability changes

## Rate Limiting (Future)

Rate limiting will be implemented per organization:
- 1000 requests per hour per organization
- 100 requests per minute per IP

## Changelog

### v1.0.0 (Current)
- Students, Teachers, Groups, Lessons APIs
- Teacher availability with exceptions
- Conflict detection
- Role-based authorization
- 274 passing tests

---

For more information, see the main [README](../../README.md).
