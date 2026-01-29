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
  status: 'active' | 'at-risk' | 'inactive';
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
  daysOfWeek: number[]; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  roomId?: string;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  teacherName?: string; // Populated field
  roomId?: string;
  roomName?: string; // Populated field
  studentIds: string[];
  studentsCount?: number;
  scheduleRule?: ScheduleRule;
  schedule?: string; // Human readable schedule
  progress?: number;
  nextLesson?: string;
  color?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  startAt: string; // ISO DateTime
  endAt: string; // ISO DateTime
  type: 'group' | 'one_on_one';
  groupId?: string;
  groupName?: string; // Populated
  studentId?: string;
  studentName?: string; // Populated
  teacherId: string;
  teacherName?: string; // Populated
  roomId?: string;
  roomName?: string; // Populated
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  type: 'teacher_change' | 'student_request' | 'room_change';
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  reviewerId?: string;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
}

export interface ScheduleConflict {
  id: string;
  type: 'teacher' | 'room';
  description: string;
  lessonIds: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface ConflictingLesson {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
}

export interface ScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  lessonTitle: string;
  teacher: string;
  room: string;
  group: string;
  color?: string;
}

// ============================================
// REQUEST/RESPONSE TYPES
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

export interface LessonsResponse extends PaginatedResponse<Lesson> {}

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

export interface TeachersResponse extends PaginatedResponse<Teacher> {}

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

export interface GroupsResponse extends PaginatedResponse<Group> {}

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

export interface StudentsResponse extends PaginatedResponse<Student> {}

// Rooms
export interface RoomsQuery {
  page?: number;
  limit?: number;
  status?: string;
  floor?: string;
  search?: string;
}

export interface RoomsResponse extends PaginatedResponse<Room> {}

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
  action: 'approve' | 'reject';
  reviewerId?: string;
  reviewerNote?: string;
}

// Scheduling
export interface SchedulingQuery {
  startDate?: string;
  endDate?: string;
}

export interface SchedulingResponse {
  lessonsCount: number;
  conflicts: ScheduleConflict[];
  conflictsCount: number;
}

// Schedule (weekly view)
export interface ScheduleQuery {
  weekStart: string; // ISO date
}

export interface ScheduleResponse {
  slots: ScheduleSlot[];
  conflicts: ScheduleConflict[];
}

// Dashboard stats
export interface DashboardStatsResponse {
  teachersCount: number;
  studentsCount: number;
  activeGroups: number;
  roomsInUse: string;
  pendingApprovals: number;
}

// Auth
export interface MeResponse {
  user: User;
}

// Success response
export interface SuccessResponse {
  success: boolean;
  [key: string]: unknown;
}
