// ============================================
// BUSALA IN-MEMORY DATA STORE
// ============================================
// This is an in-memory store for rapid development.
// Can be easily swapped for Prisma/Drizzle with the same interface.

import type {
  Teacher,
  Student,
  Room,
  Group,
  Lesson,
  Approval,
  User,
} from './types';

// In-memory collections
let teachers: Map<string, Teacher> = new Map();
let students: Map<string, Student> = new Map();
let rooms: Map<string, Room> = new Map();
let groups: Map<string, Group> = new Map();
let lessons: Map<string, Lesson> = new Map();
let approvals: Map<string, Approval> = new Map();
let users: Map<string, User> = new Map();

// Default organization ID for single-tenant mode
export const DEFAULT_ORG_ID = 'org_busala_default';

// ============================================
// TEACHERS
// ============================================
export const teacherStore = {
  getAll: (orgId: string = DEFAULT_ORG_ID): Teacher[] => {
    return Array.from(teachers.values()).filter(t => t.orgId === orgId);
  },
  getById: (id: string): Teacher | undefined => {
    return teachers.get(id);
  },
  create: (teacher: Teacher): Teacher => {
    teachers.set(teacher.id, teacher);
    return teacher;
  },
  update: (id: string, updates: Partial<Teacher>): Teacher | undefined => {
    const existing = teachers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    teachers.set(id, updated);
    return updated;
  },
  delete: (id: string): boolean => {
    return teachers.delete(id);
  },
  count: (orgId: string = DEFAULT_ORG_ID): number => {
    return Array.from(teachers.values()).filter(t => t.orgId === orgId).length;
  },
};

// ============================================
// STUDENTS
// ============================================
export const studentStore = {
  getAll: (orgId: string = DEFAULT_ORG_ID): Student[] => {
    return Array.from(students.values()).filter(s => s.orgId === orgId);
  },
  getById: (id: string): Student | undefined => {
    return students.get(id);
  },
  create: (student: Student): Student => {
    students.set(student.id, student);
    return student;
  },
  update: (id: string, updates: Partial<Student>): Student | undefined => {
    const existing = students.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    students.set(id, updated);
    return updated;
  },
  delete: (id: string): boolean => {
    return students.delete(id);
  },
  count: (orgId: string = DEFAULT_ORG_ID): number => {
    return Array.from(students.values()).filter(s => s.orgId === orgId).length;
  },
  getByGroupId: (groupId: string): Student[] => {
    return Array.from(students.values()).filter(s => s.groupIds.includes(groupId));
  },
};

// ============================================
// ROOMS
// ============================================
export const roomStore = {
  getAll: (orgId: string = DEFAULT_ORG_ID): Room[] => {
    return Array.from(rooms.values()).filter(r => r.orgId === orgId);
  },
  getById: (id: string): Room | undefined => {
    return rooms.get(id);
  },
  create: (room: Room): Room => {
    rooms.set(room.id, room);
    return room;
  },
  update: (id: string, updates: Partial<Room>): Room | undefined => {
    const existing = rooms.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    rooms.set(id, updated);
    return updated;
  },
  delete: (id: string): boolean => {
    return rooms.delete(id);
  },
  count: (orgId: string = DEFAULT_ORG_ID): number => {
    return Array.from(rooms.values()).filter(r => r.orgId === orgId).length;
  },
};

// ============================================
// GROUPS
// ============================================
export const groupStore = {
  getAll: (orgId: string = DEFAULT_ORG_ID): Group[] => {
    return Array.from(groups.values()).filter(g => g.orgId === orgId);
  },
  getById: (id: string): Group | undefined => {
    return groups.get(id);
  },
  create: (group: Group): Group => {
    groups.set(group.id, group);
    return group;
  },
  update: (id: string, updates: Partial<Group>): Group | undefined => {
    const existing = groups.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    groups.set(id, updated);
    return updated;
  },
  delete: (id: string): boolean => {
    return groups.delete(id);
  },
  count: (orgId: string = DEFAULT_ORG_ID): number => {
    return Array.from(groups.values()).filter(g => g.orgId === orgId).length;
  },
  getByTeacherId: (teacherId: string): Group[] => {
    return Array.from(groups.values()).filter(g => g.teacherId === teacherId);
  },
};

// ============================================
// LESSONS
// ============================================
export const lessonStore = {
  getAll: (orgId: string = DEFAULT_ORG_ID): Lesson[] => {
    return Array.from(lessons.values()).filter(l => l.orgId === orgId);
  },
  getById: (id: string): Lesson | undefined => {
    return lessons.get(id);
  },
  create: (lesson: Lesson): Lesson => {
    lessons.set(lesson.id, lesson);
    return lesson;
  },
  update: (id: string, updates: Partial<Lesson>): Lesson | undefined => {
    const existing = lessons.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    lessons.set(id, updated);
    return updated;
  },
  delete: (id: string): boolean => {
    return lessons.delete(id);
  },
  count: (orgId: string = DEFAULT_ORG_ID): number => {
    return Array.from(lessons.values()).filter(l => l.orgId === orgId).length;
  },
  getByDateRange: (orgId: string, startDate: string, endDate: string): Lesson[] => {
    return Array.from(lessons.values()).filter(l =>
      l.orgId === orgId &&
      l.startAt >= startDate &&
      l.startAt <= endDate
    );
  },
  getByTeacherId: (teacherId: string): Lesson[] => {
    return Array.from(lessons.values()).filter(l => l.teacherId === teacherId);
  },
  getByRoomId: (roomId: string): Lesson[] => {
    return Array.from(lessons.values()).filter(l => l.roomId === roomId);
  },
  getByGroupId: (groupId: string): Lesson[] => {
    return Array.from(lessons.values()).filter(l => l.groupId === groupId);
  },
};

// ============================================
// APPROVALS
// ============================================
export const approvalStore = {
  getAll: (orgId: string = DEFAULT_ORG_ID): Approval[] => {
    return Array.from(approvals.values()).filter(a => a.orgId === orgId);
  },
  getById: (id: string): Approval | undefined => {
    return approvals.get(id);
  },
  create: (approval: Approval): Approval => {
    approvals.set(approval.id, approval);
    return approval;
  },
  update: (id: string, updates: Partial<Approval>): Approval | undefined => {
    const existing = approvals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    approvals.set(id, updated);
    return updated;
  },
  delete: (id: string): boolean => {
    return approvals.delete(id);
  },
  count: (orgId: string = DEFAULT_ORG_ID): number => {
    return Array.from(approvals.values()).filter(a => a.orgId === orgId).length;
  },
  getPending: (orgId: string = DEFAULT_ORG_ID): Approval[] => {
    return Array.from(approvals.values()).filter(a => a.orgId === orgId && a.status === 'pending');
  },
};

// ============================================
// USERS
// ============================================
export const userStore = {
  getAll: (orgId: string = DEFAULT_ORG_ID): User[] => {
    return Array.from(users.values()).filter(u => u.orgId === orgId);
  },
  getById: (id: string): User | undefined => {
    return users.get(id);
  },
  getByEmail: (email: string): User | undefined => {
    return Array.from(users.values()).find(u => u.email === email);
  },
  create: (user: User): User => {
    users.set(user.id, user);
    return user;
  },
  update: (id: string, updates: Partial<User>): User | undefined => {
    const existing = users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    users.set(id, updated);
    return updated;
  },
  delete: (id: string): boolean => {
    return users.delete(id);
  },
};

// ============================================
// RESET (for testing)
// ============================================
export function resetStore(): void {
  teachers = new Map();
  students = new Map();
  rooms = new Map();
  groups = new Map();
  lessons = new Map();
  approvals = new Map();
  users = new Map();
}

// ============================================
// BULK IMPORT (for seeding)
// ============================================
export function bulkImport(data: {
  teachers?: Teacher[];
  students?: Student[];
  rooms?: Room[];
  groups?: Group[];
  lessons?: Lesson[];
  approvals?: Approval[];
  users?: User[];
}): void {
  if (data.teachers) {
    data.teachers.forEach(t => teachers.set(t.id, t));
  }
  if (data.students) {
    data.students.forEach(s => students.set(s.id, s));
  }
  if (data.rooms) {
    data.rooms.forEach(r => rooms.set(r.id, r));
  }
  if (data.groups) {
    data.groups.forEach(g => groups.set(g.id, g));
  }
  if (data.lessons) {
    data.lessons.forEach(l => lessons.set(l.id, l));
  }
  if (data.approvals) {
    data.approvals.forEach(a => approvals.set(a.id, a));
  }
  if (data.users) {
    data.users.forEach(u => users.set(u.id, u));
  }
}
