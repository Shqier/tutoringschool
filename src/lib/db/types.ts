// ============================================
// BUSALA DATABASE TYPES
// ============================================

export type TeacherStatus = 'active' | 'inactive';
export type StudentStatus = 'active' | 'at-risk' | 'inactive';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type LessonStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type LessonType = 'group' | 'one_on_one';
export type ApprovalType = 'teacher_change' | 'student_request' | 'room_change';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'manager' | 'teacher' | 'staff';
export type Priority = 'low' | 'medium' | 'high';

export interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

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

export interface ScheduleRule {
  daysOfWeek: number[];    // 0-6
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  roomId?: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subjects: string[];
  status: TeacherStatus;
  weeklyAvailability: AvailabilitySlot[];
  availabilityExceptions: AvailabilityException[];
  hoursThisWeek: number;
  maxHours: number;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: StudentStatus;
  groupIds: string[];
  attendancePercent: number;
  balance: number;
  plan: string;
  enrolledDate: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  status: RoomStatus;
  floor?: string;
  equipment: string[];
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  roomId?: string;
  studentIds: string[];
  scheduleRule?: ScheduleRule;
  color?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  startAt: string;    // ISO 8601
  endAt: string;      // ISO 8601
  type: LessonType;
  groupId?: string;
  studentId?: string;
  teacherId: string;
  roomId?: string;
  status: LessonStatus;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  priority: Priority;
  requesterId: string;
  requesterName: string;
  reviewerId?: string;
  reviewerNote?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConflict {
  id: string;
  type: 'teacher' | 'room';
  description: string;
  lessonIds: string[];
  severity: 'low' | 'medium' | 'high';
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// API Error
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
