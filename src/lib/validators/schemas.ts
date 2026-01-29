// ============================================
// BUSALA ZOD VALIDATION SCHEMAS
// ============================================

import { z } from 'zod';

// ============================================
// COMMON
// ============================================
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// TEACHER
// ============================================
export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

export const availabilityExceptionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['unavailable', 'available']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
  allDay: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'endDate must be on or after startDate' }
).refine(
  (data) => {
    if (!data.allDay) {
      return !!data.startTime && !!data.endTime;
    }
    return true;
  },
  { message: 'startTime and endTime required when allDay is false' }
);

export const createTeacherSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subjects: z.array(z.string()).min(1),
  status: z.enum(['active', 'inactive']).default('active'),
  weeklyAvailability: z.array(availabilitySlotSchema).default([]),
  availabilityExceptions: z.array(availabilityExceptionSchema).default([]),
  maxHours: z.number().int().min(1).max(60).default(25),
});

export const updateTeacherSchema = createTeacherSchema.partial();

// ============================================
// STUDENT
// ============================================
export const createStudentSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  status: z.enum(['active', 'at_risk', 'inactive']).default('active'),
  groupIds: z.array(z.string()).default([]),
  balance: z.number().default(0),
  plan: z.string().default('Monthly Basic'),
});

export const updateStudentSchema = createStudentSchema.partial();

// ============================================
// ROOM
// ============================================
export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().int().min(1).max(500),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
  floor: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

export const updateRoomSchema = createRoomSchema.partial();

// ============================================
// GROUP
// ============================================
export const scheduleRuleSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  roomId: z.string().optional(),
});

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  teacherId: z.string().min(1),
  roomId: z.string().optional(),
  studentIds: z.array(z.string()).default([]),
  scheduleRule: scheduleRuleSchema.optional(),
  color: z.string().optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const assignStudentsSchema = z.object({
  studentIds: z.array(z.string()),
});

// ============================================
// LESSON
// ============================================
export const createLessonSchema = z.object({
  title: z.string().min(2).max(200),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: z.enum(['group', 'one_on_one']),
  groupId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  teacherId: z.string().min(1),
  roomId: z.string().min(1).optional(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled']).default('upcoming'),
}).refine(
  (data) => new Date(data.endAt) > new Date(data.startAt),
  { message: 'endAt must be after startAt' }
).refine(
  (data) => {
    if (data.type === 'group') return !!data.groupId;
    if (data.type === 'one_on_one') return !!data.studentId;
    return true;
  },
  { message: 'groupId required for group lessons, studentId required for one_on_one lessons' }
);

export const updateLessonSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  teacherId: z.string().min(1).optional(),
  roomId: z.string().min(1).optional().nullable(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const lessonFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  teacherId: z.string().optional(),
  roomId: z.string().optional(),
  groupId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled']).optional(),
});

// ============================================
// APPROVAL
// ============================================
export const createApprovalSchema = z.object({
  type: z.enum(['teacher_change', 'student_request', 'room_change']),
  title: z.string().min(2).max(200),
  description: z.string().min(2).max(1000),
  payload: z.record(z.string(), z.unknown()).default({}),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  requesterId: z.string().min(1),
  requesterName: z.string().min(1),
});

export const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewerId: z.string().min(1).optional(),
  reviewerNote: z.string().max(500).optional(),
});

// ============================================
// SCHEDULING
// ============================================
export const generateLessonsSchema = z.object({
  groupId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const checkConflictsSchema = z.object({
  teacherId: z.string().min(1).optional(),
  roomId: z.string().min(1).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  excludeLessonId: z.string().min(1).optional(),
});

// Type exports
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type LessonFilter = z.infer<typeof lessonFilterSchema>;
export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;
export type ApprovalAction = z.infer<typeof approvalActionSchema>;
export type GenerateLessonsInput = z.infer<typeof generateLessonsSchema>;
export type CheckConflictsInput = z.infer<typeof checkConflictsSchema>;
