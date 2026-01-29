// ============================================
// BUSALA DASHBOARD TYPE DEFINITIONS
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatarUrl?: string;
}

export interface StatCard {
  id: string;
  label: string;
  value: number | string;
  icon?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export interface Lesson {
  id: string;
  title: string;
  time: string;
  duration: string;
  room: string;
  teacher: string;
  teacherAvatar?: string;
  group: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
}

export interface Group {
  id: string;
  name: string;
  studentsCount: number;
  teacherName: string;
  teacherAvatar?: string;
  schedule: string;
  nextLesson: string;
  progress: number;
}

export interface Teacher {
  id: string;
  name: string;
  avatarUrl?: string;
  subject: string;
  subjects?: string[];
  hoursThisWeek: number;
  maxHours: number;
  lessonsToday: number;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  availability?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  groups: string[];
  attendancePercent: number;
  lastSession: string;
  balance: number;
  plan: string;
  status: 'active' | 'at-risk' | 'inactive';
  phone?: string;
  enrolledDate?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: 'available' | 'occupied' | 'maintenance';
  floor?: string;
  equipment?: string[];
  utilizationPercent?: number;
}

export interface Approval {
  id: string;
  type: 'teacher-change' | 'student-request' | 'room-change';
  title: string;
  description: string;
  requester: string;
  requesterAvatar?: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  priority?: 'low' | 'medium' | 'high';
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

export interface ScheduleConflict {
  id: string;
  type: 'room' | 'teacher' | 'time';
  description: string;
  affectedSlots: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface ScheduleRequest {
  id: string;
  type: 'reschedule' | 'cancel' | 'add';
  requestedBy: string;
  timestamp: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SettingsSection {
  id: string;
  title: string;
  description?: string;
}

export interface SchoolProfile {
  name: string;
  address: string;
  timezone: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface Preference {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface RolePermission {
  id: string;
  role: string;
  permissions: string[];
  usersCount: number;
}

export interface BillingInfo {
  plan: string;
  status: 'active' | 'past-due' | 'cancelled';
  nextBillingDate: string;
  amount: number;
  currency: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  author: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  description?: string;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
  label?: string;
}

export interface ResourceUtilization {
  rooms: {
    total: number;
    inUse: number;
    available: number;
    utilizationPercent: number;
    heatmap: HeatmapCell[];
  };
  teachers: {
    total: number;
    teaching: number;
    available: number;
    utilizationPercent: number;
    heatmap: HeatmapCell[];
  };
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
  isActive?: boolean;
}

export interface DashboardData {
  user: User;
  stats: StatCard[];
  todaysLessons: Lesson[];
  groups: Group[];
  teachers: Teacher[];
  resourceUtilization: ResourceUtilization;
  announcements: Announcement[];
  quickActions: QuickAction[];
}
