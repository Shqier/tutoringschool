// ============================================
// BUSALA API TYPE DEFINITIONS
// Generated from busala-sync.json v0.5 contract
// ============================================

// Base API error
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ============================================
// ENTITY TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'teacher' | 'staff';
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6, 0=Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface AvailabilityException {
  id: string;
  type: 'unavailable' | 'available';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  allDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subjects: string[];
  status: 'active' | 'inactive';
  weeklyAvailability?: AvailabilitySlot[];
  availabilityExceptions?: AvailabilityException[];
  hoursThisWeek?: number;
  maxHours?: number;
  lessonsToday?: number; // Computed field: count of lessons today
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: 'active' | 'at_risk' | 'inactive';
  groupIds: string[];
  attendancePercent?: number;
  balance?: number;
  plan?: string;
  enrolledDate?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy?: number;
  status: 'available' | 'occupied' | 'maintenance';
  floor?: string;
  equipment?: string[];
  utilizationPercent?: number;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRule {
  daysOfWeek: number[]; // 0-6, 0=Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  roomId?: string;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  teacherName?: string; // populated
  roomId?: string;
  roomName?: string; // populated
  studentCount?: number;
  color?: string;
  scheduleRule?: ScheduleRule;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: 'group' | 'one_on_one';
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  teacherId: string;
  teacherName?: string; // populated
  groupId?: string;
  groupName?: string; // populated
  studentId?: string;
  studentName?: string; // populated
  roomId?: string;
  roomName?: string; // populated
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictingLesson {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  teacherId?: string;
  roomId?: string;
  type: 'teacher' | 'room' | 'availability';
}

export interface Approval {
  id: string;
  type: 'teacher_change' | 'student_request' | 'room_change';
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  requestedBy: string;
  requestedByName?: string; // populated
  reviewedBy?: string;
  reviewedByName?: string; // populated
  requestedAt: string;
  reviewedAt?: string;
  reason?: string;
  reviewerNote?: string;
  relatedEntity: {
    type: 'teacher' | 'student' | 'room' | 'lesson' | 'group';
    id: string;
    name?: string;
  };
  details?: Record<string, unknown>;
  orgId: string;
}

// ============================================
// QUERY & INPUT TYPES
// ============================================

// Lessons
export interface LessonsQuery {
  page?: number;
  limit?: number;
  date?: string; // Single day filter (YYYY-MM-DD) - converted to startDate/endDate
  startDate?: string;
  endDate?: string;
  teacherId?: string;
  roomId?: string;
  groupId?: string;
  status?: string;
}

export type LessonsResponse = PaginatedResponse<Lesson>

export interface CreateLessonInput {
  title: string;
  startAt: string;
  endAt: string;
  type: 'group' | 'one_on_one';
  groupId?: string;
  studentId?: string;
  teacherId: string;
  roomId?: string;
  status?: Lesson['status'];
}

export type UpdateLessonInput = Partial<CreateLessonInput>;

// Conflict response (409 status)
export interface ConflictResponse {
  success: false;
  conflicts: {
    teacher?: ConflictingLesson[];
    room?: ConflictingLesson[];
    availability?: string[]; // Array of availability conflict descriptions
  };
  message: string;
}

// Teachers
export interface TeachersQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export type TeachersResponse = PaginatedResponse<Teacher>

export interface CreateTeacherInput {
  fullName: string;
  email: string;
  phone?: string;
  subjects: string[];
  status?: 'active' | 'inactive';
  weeklyAvailability?: AvailabilitySlot[];
  availabilityExceptions?: AvailabilityException[];
  maxHours?: number;
}

export type UpdateTeacherInput = Partial<CreateTeacherInput>;

// Groups
export interface GroupsQuery {
  page?: number;
  limit?: number;
  teacherId?: string;
  search?: string;
}

export type GroupsResponse = PaginatedResponse<Group>

export interface GroupDetailResponse extends Group {
  teacher?: Teacher;
  room?: Room;
  students?: Student[];
}

export interface CreateGroupInput {
  name: string;
  teacherId: string;
  roomId?: string;
  studentIds?: string[];
  scheduleRule?: ScheduleRule;
  color?: string;
}

export type UpdateGroupInput = Partial<CreateGroupInput>;

export interface AssignStudentsInput {
  studentIds: string[];
}

// Students
export interface StudentsQuery {
  page?: number;
  limit?: number;
  status?: string;
  groupId?: string;
  search?: string;
}

export type StudentsResponse = PaginatedResponse<Student>

export interface CreateStudentInput {
  fullName: string;
  email: string;
  phone?: string;
  status?: 'active' | 'at_risk' | 'inactive';
  groupIds?: string[];
  balance?: number;
  plan?: string;
}

export type UpdateStudentInput = Partial<CreateStudentInput>;

// Rooms
export interface RoomsQuery {
  page?: number;
  limit?: number;
  status?: string;
  floor?: string;
  search?: string;
}

export type RoomsResponse = PaginatedResponse<Room>

export interface CreateRoomInput {
  name: string;
  capacity: number;
  status?: 'available' | 'occupied' | 'maintenance';
  floor?: string;
  equipment?: string[];
}

export type UpdateRoomInput = Partial<CreateRoomInput>;

// Approvals
export interface ApprovalsQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  priority?: string;
}

export interface ApprovalsResponse extends PaginatedResponse<Approval> {
  counts?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType?: {
      teacher_change: number;
      student_request: number;
      room_change: number;
    };
  };
}

export interface ApprovalActionInput {
  reviewerNote?: string;
}

// Scheduling
export interface SchedulingQuery {
  startDate?: string;
  endDate?: string;
  teacherId?: string;
  roomId?: string;
  groupId?: string;
}

export interface SchedulingResponse {
  lessons: Lesson[];
  teachers: {
    id: string;
    name: string;
    hoursScheduled: number;
    maxHours: number;
    availability: AvailabilitySlot[];
  }[];
  rooms: {
    id: string;
    name: string;
    utilizationPercent: number;
  }[];
}
