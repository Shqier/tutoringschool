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
  avatarUrl?: string;
  phone?: string;
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

// Profile types (extended entities with stats / related data)
export interface TeacherProfile extends Teacher {
  totalLessonsTaught: number;
  totalStudentsTaught: number;
  recentLessons: Lesson[];
  monthlyHours: { month: string; hours: number }[];
}

export interface StudentProfile extends Student {
  attendanceHistory?: StudentAttendanceRecord[];
  notes?: string;
}

export interface GroupProfile extends Group {
  students?: Array<Student & { attendancePercent?: number }>;
  averageAttendance?: number;
  lessonsThisMonth?: number;
  progressHistory?: { date: string; progress: number }[];
}

export interface SuccessResponse {
  success: boolean;
  deletedId?: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  tier: 'elementary' | 'high_school';
  type: 'subscription' | 'pay_as_you_go';
  lessonsPerMonth?: number | null;
  monthlyPrice?: number | null;
  lessonPrice?: number | null;
  duration?: number;
  orgId: string;
  isActive?: boolean;
}

export interface Student {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: 'active' | 'at_risk' | 'inactive';
  grade?: number | null;
  planId?: string | null;
  paymentStatus?: 'active' | 'overdue' | 'cancelled' | 'suspended';
  plan?: PaymentPlan | null;
  groupIds: string[];
  attendancePercent?: number;
  enrolledDate?: string;
  notes?: string;
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
  schedule?: string; // formatted display string
  progress?: number;
  nextLesson?: string;
  studentIds?: string[]; // populated by GET /api/groups/[id]
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
  requesterName?: string; // API may return this
  requesterAvatar?: string;
  reviewedBy?: string;
  reviewedByName?: string; // populated
  requestedAt: string;
  createdAt?: string; // API may return this
  reviewedAt?: string;
  reason?: string;
  reviewerNote?: string;
  title?: string;
  description?: string;
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

/** Scheduling overview conflicts (GET /api/scheduling) */
export interface ScheduleConflict {
  id: string;
  type: 'teacher' | 'room';
  description: string;
  lessonIds: string[];
  severity: 'low' | 'medium' | 'high';
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

export interface GroupStatsResponse {
  averageAttendance: number;
  lessonsThisMonth: number;
  totalStudents: number;
  nextLesson: { id: string; title: string; startAt: string } | null;
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

export interface CreateStudentInput {
  fullName: string;
  email: string;
  phone?: string;
  status?: 'active' | 'at_risk' | 'inactive';
  groupIds?: string[];
  grade?: number | null;
  planId?: string | null;
  paymentStatus?: 'active' | 'overdue' | 'cancelled' | 'suspended';
  notes?: string;
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
  lessonsCount: number;
  conflicts: ScheduleConflict[];
  conflictsCount: number;
}

// ============================================
// AVAILABILITY TYPES
// ============================================

export interface DayAvailability {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  slots: {
    start: string; // HH:mm
    end: string;   // HH:mm
  }[];
}

export interface TeacherAvailability {
  teacher: {
    id: string;
    fullName: string;
  };
  availability: DayAvailability[];
  status: 'confirmed' | 'pending' | 'updated';
  confirmedAt?: string;
  confirmedForMonth?: number;
  confirmedForYear?: number;
  lastUpdated: string;
}

export type UpdateAvailabilityInput = DayAvailability[];

export interface PendingTeacher {
  id: string;
  fullName: string;
  email: string;
  hasAvailability: boolean;
  status: 'confirmed' | 'pending' | 'updated';
  confirmedAt?: string;
  confirmedForMonth?: number;
  confirmedForYear?: number;
  daysSinceConfirmed: number | null;
  isCurrentMonthConfirmed: boolean;
  lastUpdated: string;
}

export interface PendingConfirmationsResponse {
  month: number;
  year: number;
  summary: {
    total: number;
    pending: number;
    confirmed: number;
    updated: number;
    autoConfirmDate: string;
    daysUntilAutoConfirm: number;
  };
  teachers: {
    pending: PendingTeacher[];
    confirmed: PendingTeacher[];
    updated: PendingTeacher[];
  };
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  type: 'availability_confirmation' | 'approval_request' | 'approval_resolved' | 'lesson_reminder' | 'payment_due' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  count: number;
}

// ============================================
// AUTH & SETTINGS TYPES
// ============================================

export interface MeResponse {
  user: User;
}

export interface SettingsProfile {
  name: string;
  address: string;
  timezone: string;
  phone?: string;
  email?: string;
  orgId?: string;
}

export interface RolesResponse {
  roles: Array<{ id: string; role: string; permissions: string[]; usersCount: number }>;
}

export interface UserPreferencesResponse {
  language: string;
  timezone: string;
  notifications?: Record<string, boolean>;
}

export interface ScheduleQuery {
  weekStart: string;
}

export interface ScheduleResponse {
  slots: Array<{
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    lessonTitle: string;
    teacher: string;
    room: string;
    group: string;
    color?: string;
  }>;
  conflicts?: unknown[];
}

export interface DashboardStatsResponse {
  teachersCount: number;
  studentsCount: number;
  activeGroups: number;
  roomsInUse: string;
  pendingApprovals: number;
}

// ============================================
// ATTENDANCE TYPES
// ============================================

export type AttendanceStatusType = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  status: AttendanceStatusType;
  markedById: string;
  markedAt: string;
  note?: string;
}

export interface AttendanceWithStudent extends Attendance {
  student: {
    id: string;
    fullName: string;
  };
}

export interface LessonAttendance {
  lessonId: string;
  lesson?: {
    title: string;
    startAt: string;
    endAt: string;
    groupName: string | null;
    teacherName: string | null;
    roomName: string | null;
  };
  attendances: AttendanceWithStudent[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

export interface BulkAttendanceItem {
  studentId: string;
  status: AttendanceStatusType;
  note?: string;
}

export interface BulkAttendanceInput {
  attendances: BulkAttendanceItem[];
}

export interface StudentAttendanceRecord {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonDate: string;
  groupName: string | null;
  status: AttendanceStatusType;
  note?: string;
  markedAt: string;
}

export interface StudentAttendanceResponse {
  studentId: string;
  from: string;
  to: string;
  records: StudentAttendanceRecord[];
  attendancePercent: number;
}

export interface GroupAttendanceRecord {
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  lessonDate: string;
  status: AttendanceStatusType;
  note?: string;
}

export interface GroupAttendanceResponse {
  groupId: string;
  from: string;
  to: string;
  byStudent?: Record<string, GroupAttendanceRecord[]>;
  byLesson?: Array<{ lessonId: string; lessonTitle: string; lessonDate: string; records: GroupAttendanceRecord[] }>;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface StudentSubscription {
  id: string;
  studentId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'paused';
  startDate: string;
  endDate?: string | null;
  billingDay: number;
  lastPaymentDate?: string | null;
  nextPaymentDate: string;
  orgId: string;
  plan?: PaymentPlan;
}

export interface Payment {
  id: string;
  studentId: string;
  subscriptionId?: string | null;
  amount: number;
  currency: string;
  type: 'subscription_monthly' | 'private_lesson' | 'prorated' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string | null;
  reference?: string | null;
  lessonIds?: string[];
  dueDate: string;
  paidDate?: string | null;
  notes?: string | null;
  student?: { id: string; fullName: string; email?: string };
  subscription?: StudentSubscription & { plan?: PaymentPlan };
}

export interface LessonCreditsResponse {
  studentId: string;
  year: number;
  month: number;
  credits: {
    lessonsIncluded: number;
    lessonsUsed: number;
    lessonsRemaining: number;
    resetDate: string;
  } | null;
  plan: { id: string; name: string; type: string; lessonsPerMonth?: number } | null;
  message?: string;
}
