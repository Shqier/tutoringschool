// ============================================
// BUSALA FORM VALIDATION SCHEMAS
// Using Zod for runtime validation
// ============================================

import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required');

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]*$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

// ============================================
// STUDENT SCHEMAS
// ============================================

export const createStudentSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  phone: phoneSchema,
  status: z.enum(['active', 'at_risk', 'inactive']).default('active'),
  groupIds: z.array(z.string()).default([]),
  balance: z.number().default(0),
  plan: z.string().default('Monthly Basic'),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
export type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;

// ============================================
// TEACHER SCHEMAS
// ============================================

export const createTeacherSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  phone: phoneSchema,
  subjects: z
    .array(z.string())
    .min(1, 'At least one subject is required'),
  maxHours: z
    .number()
    .min(1, 'Max hours must be at least 1')
    .max(60, 'Max hours cannot exceed 60')
    .optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

export type CreateTeacherFormData = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

// ============================================
// LESSON SCHEMAS
// ============================================

export const createLessonSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be less than 200 characters'),
  startAt: z.string().min(1, 'Start time is required'),
  endAt: z.string().min(1, 'End time is required'),
  type: z.enum(['group', 'one_on_one']),
  teacherId: z.string().min(1, 'Teacher is required'),
  groupId: z.string().optional(),
  studentId: z.string().optional(),
  roomId: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'group' && !data.groupId) {
      return false;
    }
    if (data.type === 'one_on_one' && !data.studentId) {
      return false;
    }
    return true;
  },
  {
    message: 'Group is required for group lessons, student is required for 1-on-1 lessons',
    path: ['groupId'],
  }
).refine(
  (data) => {
    const start = new Date(data.startAt);
    const end = new Date(data.endAt);
    return end > start;
  },
  {
    message: 'End time must be after start time',
    path: ['endAt'],
  }
);

export const updateLessonSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  type: z.enum(['group', 'one_on_one']).optional(),
  teacherId: z.string().optional(),
  groupId: z.string().optional(),
  studentId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled']).optional(),
});

export type CreateLessonFormData = z.infer<typeof createLessonSchema>;
export type UpdateLessonFormData = z.infer<typeof updateLessonSchema>;

// ============================================
// GROUP SCHEMAS
// ============================================

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  teacherId: z.string().min(1, 'Teacher is required'),
  roomId: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const assignStudentsSchema = z.object({
  studentIds: z.array(z.string()),
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
export type UpdateGroupFormData = z.infer<typeof updateGroupSchema>;
export type AssignStudentsFormData = z.infer<typeof assignStudentsSchema>;

// ============================================
// ROOM SCHEMAS
// ============================================

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name must be less than 50 characters'),
  capacity: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500'),
  floor: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

// Form data type with status required (since forms always provide it)
export type CreateRoomFormData = z.infer<typeof createRoomSchema>;
export type UpdateRoomFormData = z.infer<typeof updateRoomSchema>;

// ============================================
// APPROVAL SCHEMAS
// ============================================

export const rejectApprovalSchema = z.object({
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

export type RejectApprovalFormData = z.infer<typeof rejectApprovalSchema>;
