// ============================================
// BUSALA API CLIENT
// Typed fetch wrapper for backend API calls
// Updated to match busala-sync.json v0.5 contract
// ============================================

import type { ApiError, ConflictResponse } from './types';

const API_BASE = '/api';

export class ApiClientError extends Error {
  code: string;
  details?: unknown;
  statusCode?: number;

  constructor(error: ApiError, statusCode?: number) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.details = error.details;
    this.statusCode = statusCode;
  }
}

export class ApiConflictError extends Error {
  conflicts: ConflictResponse['conflicts'];
  statusCode: number = 409;

  constructor(conflictResponse: ConflictResponse) {
    super(conflictResponse.message);
    this.name = 'ApiConflictError';
    this.conflicts = conflictResponse.conflicts;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  forceCreate?: boolean; // For overriding conflicts
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, signal, forceCreate } = options;

  // Remove leading /api if endpoint already starts with it
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint;
  const url = cleanEndpoint.startsWith('/') ? `${API_BASE}${cleanEndpoint}` : `${API_BASE}/${cleanEndpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Dev auth: use user_001 (seeded admin) so /api/auth/me returns real user
      'x-user-role': 'admin',
      'x-user-id': 'user_001',
      'x-org-id': 'org_busala_default',
      ...headers,
    },
    signal,
  };

  // Add force-create header if requested
  if (forceCreate && (method === 'POST' || method === 'PATCH')) {
    config.headers = {
      ...config.headers,
      'x-force-create': 'true',
      'x-force-update': 'true',
    };
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return { success: true } as T;
  }

  const data = await response.json();

  if (!response.ok) {
    // Handle 409 Conflict specially
    if (response.status === 409 && data.conflicts) {
      throw new ApiConflictError(data as ConflictResponse);
    }

    // Handle other errors
    throw new ApiClientError(
      data.error || {
        code: 'UNKNOWN_ERROR',
        message: data.message || 'An unexpected error occurred',
      },
      response.status
    );
  }

  return data;
}

// Type for query string parameters
type QueryParams = Record<string, string | number | undefined>;

// Helper to build query string
function buildQueryString(params: QueryParams): string {
  const filtered = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] !== undefined
  );
  if (filtered.length === 0) return '';
  const searchParams = new URLSearchParams();
  filtered.forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });
  return '?' + searchParams.toString();
}

// ============================================
// API FUNCTIONS
// ============================================

import type { PaginatedResponse } from './types';
import type {
  PaymentPlan,
  Payment as PaymentType,
  StudentSubscription,
  LessonCreditsResponse,
  LessonsQuery,
  LessonsResponse,
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
  TeachersQuery,
  TeachersResponse,
  Teacher,
  TeacherProfile,
  CreateTeacherInput,
  UpdateTeacherInput,
  GroupsQuery,
  GroupsResponse,
  Group,
  GroupDetailResponse,
  GroupStatsResponse,
  CreateGroupInput,
  UpdateGroupInput,
  AssignStudentsInput,
  StudentsQuery,
  StudentsResponse,
  Student,
  CreateStudentInput,
  UpdateStudentInput,
  RoomsQuery,
  RoomsResponse,
  Room,
  CreateRoomInput,
  UpdateRoomInput,
  ApprovalsQuery,
  ApprovalsResponse,
  Approval,
  ApprovalActionInput,
  SchedulingQuery,
  SchedulingResponse,
  ScheduleQuery,
  ScheduleResponse,
  DashboardStatsResponse,
  MeResponse,
  SettingsProfile,
  RolesResponse,
  UserPreferencesResponse,
  SuccessResponse,
} from './types';

// ============================================
// AUTH
// ============================================

export async function getMe(signal?: AbortSignal): Promise<MeResponse> {
  return request<MeResponse>('/auth/me', { signal });
}

export async function updateMe(
  body: { name?: string; email?: string; phone?: string | null; avatarUrl?: string | null },
  signal?: AbortSignal
): Promise<MeResponse> {
  return request<MeResponse>('/auth/me', { method: 'PATCH', body, signal });
}

export async function changePassword(
  body: { currentPassword: string; newPassword: string; confirmPassword: string },
  signal?: AbortSignal
): Promise<{ success?: boolean }> {
  return request<{ success?: boolean }>('/auth/change-password', { method: 'POST', body, signal });
}

// ============================================
// SETTINGS & USER
// ============================================

export async function getSettingsProfile(signal?: AbortSignal): Promise<SettingsProfile & { orgId?: string }> {
  return request<SettingsProfile & { orgId?: string }>('/settings/profile', { signal });
}

export async function getRoles(signal?: AbortSignal): Promise<RolesResponse> {
  return request<RolesResponse>('/roles', { signal });
}

export async function getUserPreferences(signal?: AbortSignal): Promise<UserPreferencesResponse> {
  return request<UserPreferencesResponse>('/user/preferences', { signal });
}

export async function updateUserPreferences(
  body: { language?: string; timezone?: string; notifications?: Record<string, boolean> },
  signal?: AbortSignal
): Promise<UserPreferencesResponse> {
  return request<UserPreferencesResponse>('/user/preferences', { method: 'PATCH', body, signal });
}

// ============================================
// LESSONS
// ============================================

export async function getLessons(
  query?: LessonsQuery,
  signal?: AbortSignal
): Promise<LessonsResponse> {
  // Convert `date` shorthand to startDate/endDate range
  let processedQuery = query;
  if (query?.date) {
    const dateStr = query.date;
    // Create start of day and end of day in ISO format
    const startDate = `${dateStr}T00:00:00.000Z`;
    const endDate = `${dateStr}T23:59:59.999Z`;
    const { date: _date, ...rest } = query;
    processedQuery = { ...rest, startDate, endDate };
  }
  const qs = processedQuery ? buildQueryString(processedQuery as QueryParams) : '';
  return request<LessonsResponse>(`/lessons${qs}`, { signal });
}

export async function createLesson(
  input: CreateLessonInput,
  options?: { signal?: AbortSignal; forceCreate?: boolean }
): Promise<Lesson> {
  return request<Lesson>('/lessons', {
    method: 'POST',
    body: input,
    signal: options?.signal,
    forceCreate: options?.forceCreate,
  });
}

export async function updateLesson(
  id: string,
  input: UpdateLessonInput,
  options?: { signal?: AbortSignal; forceUpdate?: boolean }
): Promise<Lesson> {
  return request<Lesson>(`/lessons/${id}`, {
    method: 'PATCH',
    body: input,
    signal: options?.signal,
    forceCreate: options?.forceUpdate, // Uses same forceCreate internally
  });
}

export async function deleteLesson(
  id: string,
  signal?: AbortSignal
): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/lessons/${id}`, {
    method: 'DELETE',
    signal,
  });
}

// ============================================
// TEACHERS
// ============================================

export async function getTeachers(
  query?: TeachersQuery,
  signal?: AbortSignal
): Promise<TeachersResponse> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<TeachersResponse>(`/teachers${qs}`, { signal });
}

export async function getTeacher(
  id: string,
  signal?: AbortSignal
): Promise<Teacher> {
  return request<Teacher>(`/teachers/${id}`, { signal });
}

export async function getTeacherProfile(
  id: string,
  signal?: AbortSignal
): Promise<TeacherProfile> {
  return request<TeacherProfile>(`/teachers/${id}/profile`, { signal });
}

export async function getTeacherSchedule(
  id: string,
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<{ data: Lesson[] }> {
  const qs = buildQueryString({ startDate, endDate });
  return request<{ data: Lesson[] }>(`/teachers/${id}/schedule${qs}`, { signal });
}

export async function createTeacher(
  input: CreateTeacherInput,
  signal?: AbortSignal
): Promise<Teacher> {
  return request<Teacher>('/teachers', {
    method: 'POST',
    body: input,
    signal,
  });
}

export async function updateTeacher(
  id: string,
  input: UpdateTeacherInput,
  signal?: AbortSignal
): Promise<Teacher> {
  return request<Teacher>(`/teachers/${id}`, {
    method: 'PATCH',
    body: input,
    signal,
  });
}

export async function deleteTeacher(
  id: string,
  signal?: AbortSignal
): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/teachers/${id}`, {
    method: 'DELETE',
    signal,
  });
}

// ============================================
// GROUPS
// ============================================

export async function getGroups(
  query?: GroupsQuery,
  signal?: AbortSignal
): Promise<GroupsResponse> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<GroupsResponse>(`/groups${qs}`, { signal });
}

export async function getGroup(
  id: string,
  signal?: AbortSignal
): Promise<GroupDetailResponse> {
  return request<GroupDetailResponse>(`/groups/${id}`, { signal });
}

export async function getGroupStats(
  id: string,
  signal?: AbortSignal
): Promise<GroupStatsResponse> {
  return request<GroupStatsResponse>(`/groups/${id}/stats`, { signal });
}

export async function removeGroupStudent(
  groupId: string,
  studentId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/groups/${groupId}/students/${studentId}`, {
    method: 'DELETE',
    signal,
  });
}

export async function createGroup(
  input: CreateGroupInput,
  signal?: AbortSignal
): Promise<Group> {
  return request<Group>('/groups', {
    method: 'POST',
    body: input,
    signal,
  });
}

export async function updateGroup(
  id: string,
  input: UpdateGroupInput,
  signal?: AbortSignal
): Promise<Group> {
  return request<Group>(`/groups/${id}`, {
    method: 'PATCH',
    body: input,
    signal,
  });
}

export async function assignStudentsToGroup(
  id: string,
  input: AssignStudentsInput,
  signal?: AbortSignal
): Promise<Group> {
  return request<Group>(`/groups/${id}`, {
    method: 'PUT',
    body: input,
    signal,
  });
}

export async function deleteGroup(
  id: string,
  signal?: AbortSignal
): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/groups/${id}`, {
    method: 'DELETE',
    signal,
  });
}

// ============================================
// STUDENTS
// ============================================

export async function getStudents(
  query?: StudentsQuery,
  signal?: AbortSignal
): Promise<StudentsResponse> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<StudentsResponse>(`/students${qs}`, { signal });
}

export async function getStudent(
  id: string,
  signal?: AbortSignal
): Promise<Student> {
  return request<Student>(`/students/${id}`, { signal });
}

export async function createStudent(
  input: CreateStudentInput,
  signal?: AbortSignal
): Promise<Student> {
  return request<Student>('/students', {
    method: 'POST',
    body: input,
    signal,
  });
}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput,
  signal?: AbortSignal
): Promise<Student> {
  return request<Student>(`/students/${id}`, {
    method: 'PATCH',
    body: input,
    signal,
  });
}

export async function deleteStudent(
  id: string,
  signal?: AbortSignal
): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/students/${id}`, {
    method: 'DELETE',
    signal,
  });
}

// ============================================
// PAYMENT PLANS
// ============================================

export async function getPaymentPlans(
  query?: { page?: number; limit?: number; type?: string; tier?: string },
  signal?: AbortSignal
): Promise<PaginatedResponse<PaymentPlan>> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<PaginatedResponse<PaymentPlan>>(`/payment-plans${qs}`, { signal });
}

// ============================================
// STUDENT SUBSCRIPTIONS
// ============================================

export async function getStudentSubscriptions(
  studentId: string,
  signal?: AbortSignal
): Promise<StudentSubscription[]> {
  return request<StudentSubscription[]>(`/students/${studentId}/subscriptions`, { signal });
}

// ============================================
// PAYMENTS
// ============================================

export async function getPayments(
  query?: { page?: number; limit?: number; studentId?: string; status?: string },
  signal?: AbortSignal
): Promise<PaginatedResponse<PaymentType>> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<PaginatedResponse<PaymentType>>(`/payments${qs}`, { signal });
}

export async function getOverduePayments(
  signal?: AbortSignal
): Promise<PaymentType[]> {
  return request<PaymentType[]>(`/payments/overdue`, { signal });
}

export async function recordPayment(
  paymentId: string,
  input: { paymentMethod: 'cash' | 'bank_transfer' | 'override'; paidDate?: string; reference?: string; notes?: string },
  signal?: AbortSignal
): Promise<PaymentType> {
  return request<PaymentType>(`/payments/${paymentId}/record`, {
    method: 'POST',
    body: input,
    signal,
  });
}

// ============================================
// LESSON CREDITS
// ============================================

export async function getLessonCredits(
  studentId: string,
  signal?: AbortSignal
): Promise<LessonCreditsResponse> {
  return request<LessonCreditsResponse>(`/lesson-credits/${studentId}/current`, { signal });
}

// ============================================
// ROOMS
// ============================================

export async function getRooms(
  query?: RoomsQuery,
  signal?: AbortSignal
): Promise<RoomsResponse> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<RoomsResponse>(`/rooms${qs}`, { signal });
}

export async function getRoom(
  id: string,
  signal?: AbortSignal
): Promise<Room> {
  return request<Room>(`/rooms/${id}`, { signal });
}

export async function createRoom(
  input: CreateRoomInput,
  signal?: AbortSignal
): Promise<Room> {
  return request<Room>('/rooms', {
    method: 'POST',
    body: input,
    signal,
  });
}

export async function updateRoom(
  id: string,
  input: UpdateRoomInput,
  signal?: AbortSignal
): Promise<Room> {
  return request<Room>(`/rooms/${id}`, {
    method: 'PATCH',
    body: input,
    signal,
  });
}

export async function deleteRoom(
  id: string,
  signal?: AbortSignal
): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/rooms/${id}`, {
    method: 'DELETE',
    signal,
  });
}

// ============================================
// APPROVALS
// ============================================

export async function getApprovals(
  query?: ApprovalsQuery,
  signal?: AbortSignal
): Promise<ApprovalsResponse> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<ApprovalsResponse>(`/approvals${qs}`, { signal });
}

export async function updateApproval(
  id: string,
  input: ApprovalActionInput,
  signal?: AbortSignal
): Promise<Approval> {
  return request<Approval>(`/approvals/${id}`, {
    method: 'PATCH',
    body: input,
    signal,
  });
}

// Quick approve (POST /api/approvals/:id)
export async function approveApproval(
  id: string,
  reviewerNote?: string,
  signal?: AbortSignal
): Promise<Approval> {
  return request<Approval>(`/approvals/${id}`, {
    method: 'POST',
    body: reviewerNote ? { reviewerNote } : {},
    signal,
  });
}

// Quick reject (DELETE /api/approvals/:id)
export async function rejectApproval(
  id: string,
  reviewerNote?: string,
  signal?: AbortSignal
): Promise<SuccessResponse> {
  return request<SuccessResponse>(`/approvals/${id}`, {
    method: 'DELETE',
    body: reviewerNote ? { reviewerNote } : {},
    signal,
  });
}

// ============================================
// SCHEDULING
// ============================================

export async function getScheduling(
  query?: SchedulingQuery,
  signal?: AbortSignal
): Promise<SchedulingResponse> {
  const qs = query ? buildQueryString(query as QueryParams) : '';
  return request<SchedulingResponse>(`/scheduling${qs}`, { signal });
}

// Get weekly schedule (transforms lessons into schedule slots)
export async function getSchedule(
  query: ScheduleQuery,
  signal?: AbortSignal
): Promise<ScheduleResponse> {
  // Calculate week range from weekStart
  const weekStart = new Date(query.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Fetch lessons for the week
  const lessonsResponse = await getLessons(
    {
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    },
    signal
  );

  // Transform lessons into schedule slots
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const slots = lessonsResponse.data
    .filter(lesson => lesson.status !== 'cancelled')
    .map(lesson => {
      const startDate = new Date(lesson.startAt);
      const endDate = new Date(lesson.endAt);
      return {
        id: lesson.id,
        day: dayNames[startDate.getDay()],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        lessonTitle: lesson.title,
        teacher: lesson.teacherName || 'Unknown',
        room: lesson.roomName || 'No room',
        group: lesson.groupName || (lesson.studentName ? `1:1 - ${lesson.studentName}` : 'Unknown'),
        color: undefined, // Could be added based on group color
      };
    });

  // Get conflicts
  const schedulingResponse = await getScheduling(
    {
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    },
    signal
  );

  return {
    slots,
    conflicts: schedulingResponse.conflicts,
  };
}

// ============================================
// DASHBOARD
// ============================================

export async function getDashboardStats(
  signal?: AbortSignal
): Promise<DashboardStatsResponse> {
  // Aggregate stats from various endpoints
  const [teachers, students, groups, rooms, approvals] = await Promise.all([
    getTeachers({ limit: 1 }, signal),
    getStudents({ limit: 1 }, signal),
    getGroups({ limit: 1 }, signal),
    getRooms({ limit: 1 }, signal),
    getApprovals({ status: 'pending', limit: 1 }, signal),
  ]);

  // Calculate rooms in use
  const allRooms = await getRooms({ limit: 100 }, signal);
  const occupiedRooms = allRooms.data.filter(r => r.status === 'occupied').length;
  const totalRooms = allRooms.pagination.total;

  return {
    teachersCount: teachers.pagination.total,
    studentsCount: students.pagination.total,
    activeGroups: groups.pagination.total,
    roomsInUse: `${occupiedRooms}/${totalRooms}`,
    pendingApprovals: approvals.counts?.pending || approvals.pagination.total,
  };
}

// ============================================
// AVAILABILITY
// ============================================

import type {
  TeacherAvailability,
  PendingConfirmationsResponse,
  UpdateAvailabilityInput,
} from './types';

export async function getTeacherAvailability(
  teacherId: string,
  signal?: AbortSignal
): Promise<TeacherAvailability> {
  return request<TeacherAvailability>(`/teachers/${teacherId}/availability`, { signal });
}

export async function updateTeacherAvailability(
  teacherId: string,
  availability: UpdateAvailabilityInput,
  signal?: AbortSignal
): Promise<TeacherAvailability> {
  return request<TeacherAvailability>(`/teachers/${teacherId}/availability`, {
    method: 'PUT',
    body: availability,
    signal,
  });
}

export async function confirmTeacherAvailability(
  teacherId: string,
  month?: number,
  year?: number,
  signal?: AbortSignal
): Promise<TeacherAvailability> {
  const params: Record<string, string> = {};
  if (month !== undefined) params.month = String(month);
  if (year !== undefined) params.year = String(year);
  const qs = buildQueryString(params);
  return request<TeacherAvailability>(`/teachers/${teacherId}/availability/confirm${qs}`, {
    method: 'POST',
    signal,
  });
}

export async function getPendingConfirmations(
  month?: number,
  year?: number,
  signal?: AbortSignal
): Promise<PendingConfirmationsResponse> {
  const params: Record<string, string> = {};
  if (month !== undefined) params.month = String(month);
  if (year !== undefined) params.year = String(year);
  const qs = buildQueryString(params);
  return request<PendingConfirmationsResponse>(`/teachers/availability/pending${qs}`, { signal });
}

// ============================================
// NOTIFICATIONS
// ============================================

import type { Notification, NotificationsResponse } from './types';

export async function getNotifications(
  limit?: number,
  unreadOnly?: boolean,
  signal?: AbortSignal
): Promise<NotificationsResponse> {
  const params: Record<string, string> = {};
  if (limit !== undefined) params.limit = String(limit);
  if (unreadOnly) params.unread = 'true';
  const qs = buildQueryString(params);
  return request<NotificationsResponse>(`/notifications${qs}`, { signal });
}

export async function getUnreadNotificationCount(
  signal?: AbortSignal
): Promise<{ count: number }> {
  return request<{ count: number }>('/notifications/unread-count', { signal });
}

export async function markNotificationAsRead(
  id: string,
  signal?: AbortSignal
): Promise<{ success: boolean; notification: Notification }> {
  return request<{ success: boolean; notification: Notification }>(`/notifications/${id}`, {
    method: 'PATCH',
    signal,
  });
}

export async function markAllNotificationsAsRead(
  signal?: AbortSignal
): Promise<{ success: boolean; markedAsRead: number }> {
  return request<{ success: boolean; markedAsRead: number }>('/notifications/read-all', {
    method: 'PATCH',
    signal,
  });
}

// ============================================
// ATTENDANCE
// ============================================

import type { LessonAttendance, BulkAttendanceInput, StudentAttendanceResponse, GroupAttendanceResponse } from './types';

export async function getLessonAttendance(
  lessonId: string,
  signal?: AbortSignal
): Promise<{ lessonId: string; lesson?: LessonAttendance['lesson']; attendances: LessonAttendance['attendances']; stats: LessonAttendance['stats'] }> {
  return request<{ lessonId: string; lesson?: LessonAttendance['lesson']; attendances: LessonAttendance['attendances']; stats: LessonAttendance['stats'] }>(
    `/lessons/${lessonId}/attendance`,
    { signal }
  );
}

export async function saveLessonAttendance(
  lessonId: string,
  input: BulkAttendanceInput,
  signal?: AbortSignal
): Promise<{ success: boolean; lessonId: string }> {
  return request<{ success: boolean; lessonId: string }>(`/lessons/${lessonId}/attendance`, {
    method: 'POST',
    body: input,
    signal,
  });
}

export async function getStudentAttendance(
  studentId: string,
  params?: { from?: string; to?: string },
  signal?: AbortSignal
): Promise<StudentAttendanceResponse> {
  const qs = params ? buildQueryString(params as QueryParams) : '';
  return request<StudentAttendanceResponse>(`/students/${studentId}/attendance${qs}`, { signal });
}

export async function getGroupAttendance(
  groupId: string,
  params?: { from?: string; to?: string; studentId?: string; groupBy?: 'student' | 'lesson' },
  signal?: AbortSignal
): Promise<GroupAttendanceResponse> {
  const qs = params ? buildQueryString(params as QueryParams) : '';
  return request<GroupAttendanceResponse>(`/groups/${groupId}/attendance${qs}`, { signal });
}
