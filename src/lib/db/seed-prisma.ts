// ============================================
// CLASSHUB PRISMA SEED DATA - Multi-Tenant
// ============================================
// Seeds database with default plans, tenant, and sample data

import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';
import {
  teachers as mockTeachers,
  rooms as mockRooms,
  groups as mockGroups,
  students as mockStudents,
  todaysLessons as mockLessons,
  approvals as mockApprovals,
  currentUser,
} from '@/data/mock-data';

// ============================================
// DEFAULT DATA
// ============================================

export const DEFAULT_TENANT_ID = 'tenant_busala_default';
export const DEFAULT_TENANT_SLUG = 'busala-academy';
export const DEFAULT_TENANT_SUBDOMAIN = 'busala';

// Default plans
const DEFAULT_PLANS = [
  {
    id: 'plan_starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small schools and tutoring centers',
    maxTeachers: 10,
    maxStudents: 100,
    maxGroups: 5,
    maxRooms: 3,
    maxLessons: 500,
    priceMonthly: 2900, // $29.00
    priceAnnual: 29000, // $290.00
    features: ['Up to 10 teachers', 'Up to 100 students', '5 groups', '3 rooms', 'Basic scheduling', 'Email support'],
    sortOrder: 1,
  },
  {
    id: 'plan_growth',
    name: 'Growth',
    slug: 'growth',
    description: 'For growing institutions with advanced needs',
    maxTeachers: 30,
    maxStudents: 500,
    maxGroups: 15,
    maxRooms: 10,
    maxLessons: 2000,
    priceMonthly: 7900, // $79.00
    priceAnnual: 79000, // $790.00
    features: ['Up to 30 teachers', 'Up to 500 students', '15 groups', '10 rooms', 'Advanced scheduling', 'Priority support', 'Analytics dashboard'],
    sortOrder: 2,
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Unlimited everything for large organizations',
    maxTeachers: 999999,
    maxStudents: 999999,
    maxGroups: 999999,
    maxRooms: 999999,
    maxLessons: 999999,
    priceMonthly: 19900, // $199.00
    priceAnnual: 199000, // $1990.00
    features: ['Unlimited teachers', 'Unlimited students', 'Unlimited groups', 'Unlimited rooms', 'Advanced scheduling', 'Premium support', 'Analytics & Reporting', 'Custom integrations', 'Dedicated account manager'],
    sortOrder: 3,
  },
];

// Map mock availability string to weeklyAvailability JSON
function parseAvailability(availability: string | undefined): Prisma.JsonArray {
  const defaults: Record<string, { days: number[]; start: string; end: string }> = {
    'Mon-Fri, 9AM-5PM': { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
    'Mon-Thu, 10AM-6PM': { days: [1, 2, 3, 4], start: '10:00', end: '18:00' },
    'Daily, 12PM-8PM': { days: [0, 1, 2, 3, 4, 5, 6], start: '12:00', end: '20:00' },
    'Mon, Wed, Fri, 2PM-6PM': { days: [1, 3, 5], start: '14:00', end: '18:00' },
    'Weekends only': { days: [0, 6], start: '15:00', end: '19:00' },
    'Tue-Sat, 11AM-7PM': { days: [2, 3, 4, 5, 6], start: '11:00', end: '19:00' },
  };
  const parsed = defaults[availability ?? ''] ?? defaults['Mon-Fri, 9AM-5PM'];
  return parsed.days.map((dayOfWeek) => ({
    dayOfWeek,
    startTime: parsed.start,
    endTime: parsed.end,
  })) as Prisma.JsonArray;
}

// Parse duration "90 min" to minutes
function parseDuration(duration: string): number {
  const m = duration.match(/(\d+)\s*min/);
  return m ? parseInt(m[1], 10) : 60;
}

// Build date at given time today
function todayAt(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ============================================
// SEED FUNCTION
// ============================================
export async function seedDatabase(): Promise<void> {
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return;
  }

  console.log('[ClassHub] Starting multi-tenant database seed...');

  try {
    // Check if already seeded
    const existingPlans = await prisma.plan.count();
    if (existingPlans > 0) {
      console.log('[ClassHub] Database already seeded, skipping...');
      return;
    }

    // ============================================
    // 1. SEED PLANS (Platform Level)
    // ============================================
    console.log('[ClassHub] Seeding plans...');
    for (const plan of DEFAULT_PLANS) {
      await prisma.plan.create({ data: plan as Prisma.PlanCreateInput });
    }
    console.log(`[ClassHub] Created ${DEFAULT_PLANS.length} plans`);

    // ============================================
    // 2. SEED DEFAULT TENANT
    // ============================================
    console.log('[ClassHub] Seeding demo tenant (Busala Academy)...');
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

    const defaultTenant = await prisma.tenant.create({
      data: {
        id: DEFAULT_TENANT_ID,
        name: 'Busala Academy',
        slug: DEFAULT_TENANT_SLUG,
        subdomain: DEFAULT_TENANT_SUBDOMAIN,
        email: 'admin@busala-academy.com',
        phone: '+1 (555) 123-4567',
        country: 'US',
        timezone: 'America/New_York',
        planId: 'plan_growth',
        subscriptionStatus: 'trial',
        trialEndsAt: trialEndDate,
        onboardingStep: 0,
        settings: {
          workingDays: [1, 2, 3, 4, 5], // Mon-Fri
          workingHoursStart: '08:00',
          workingHoursEnd: '18:00',
          defaultLessonDuration: 60,
          academicYearStart: 9, // September
          academicYearEnd: 6, // June
        },
      },
    });
    console.log(`[ClassHub] Created tenant: ${defaultTenant.name}`);

    // ============================================
    // 3. SEED SUPER ADMIN USER
    // ============================================
    console.log('[ClassHub] Seeding super admin...');
    await prisma.superAdminUser.create({
      data: {
        id: 'superadmin_001',
        email: 'platform@classhub.com',
        hashedPassword: '$2a$10$YourHashedPasswordHere', // Placeholder - should be properly hashed
        name: 'Platform Admin',
        role: 'owner',
        isActive: true,
      },
    });
    console.log('[ClassHub] Created super admin user');

    // ID mappings (name → id)
    const teacherIds: Record<string, string> = {};
    const roomIds: Record<string, string> = {};
    const groupIds: Record<string, string> = {};
    const studentIds: Record<string, string> = {};

    // ============================================
    // 4. SEED USERS (Tenant Level)
    // ============================================
    console.log('[ClassHub] Seeding users...');
    await prisma.user.createMany({
      data: [
        {
          id: 'user_001',
          tenantId: DEFAULT_TENANT_ID,
          email: currentUser.email,
          name: currentUser.name,
          role: 'admin',
          isActive: true,
        },
        {
          id: 'user_002',
          tenantId: DEFAULT_TENANT_ID,
          email: 'manager@busala-academy.com',
          name: 'Mike Manager',
          role: 'coordinator',
          isActive: true,
        },
        {
          id: 'user_003',
          tenantId: DEFAULT_TENANT_ID,
          email: 'teacher@busala-academy.com',
          name: 'Teacher User',
          role: 'teacher',
          isActive: true,
        },
      ],
    });
    console.log('[ClassHub] Created 3 users');

    // ============================================
    // 5. SEED TEACHERS
    // ============================================
    console.log('[ClassHub] Seeding teachers...');
    const teacherData: Prisma.TeacherCreateManyInput[] = mockTeachers.map((t, i) => {
      const id = `teacher_${String(i + 1).padStart(3, '0')}`;
      teacherIds[t.name] = id;
      return {
        id,
        tenantId: DEFAULT_TENANT_ID,
        fullName: t.name,
        email: t.email ?? `${t.name.toLowerCase().replace(/\s+/g, '.')}@busala-academy.com`,
        phone: t.phone ?? null,
        subjects: t.subjects ?? (t.subject ? [t.subject] : []),
        status: t.status as 'active' | 'inactive',
        weeklyAvailability: parseAvailability(t.availability) as any,
        availabilityExceptions: [] as any,
        hoursThisWeek: t.hoursThisWeek,
        maxHours: t.maxHours,
      };
    });
    await prisma.teacher.createMany({ data: teacherData });
    console.log(`[ClassHub] Created ${teacherData.length} teachers`);

    // ============================================
    // 6. SEED ROOMS
    // ============================================
    console.log('[ClassHub] Seeding rooms...');
    const roomData: Prisma.RoomCreateManyInput[] = mockRooms.map((r, i) => {
      const id = `room_${String(i + 1).padStart(3, '0')}`;
      roomIds[r.name] = id;
      return {
        id,
        tenantId: DEFAULT_TENANT_ID,
        name: r.name,
        capacity: r.capacity,
        status: r.status as 'available' | 'occupied' | 'maintenance',
        floor: r.floor ?? null,
        equipment: r.equipment ?? [],
      };
    });
    await prisma.room.createMany({ data: roomData });
    console.log(`[ClassHub] Created ${roomData.length} rooms`);

    // Map group name to room (from todaysLessons)
    const groupToRoom: Record<string, string> = {
      'Arabic Beginners A1': 'Room 101',
      'Arabic Intermediate B1': 'Room 203',
      'Quran Memorization': 'Room 105',
      'Arabic Advanced C1': 'Room 301',
      'Islamic Studies': 'Room 102',
      'Speaking Club': 'Room 201',
    };

    // ============================================
    // 7. SEED GROUPS
    // ============================================
    console.log('[ClassHub] Seeding groups...');
    const groupsToSeed = [...mockGroups];
    if (!groupsToSeed.find((g) => g.name === 'Speaking Club')) {
      groupsToSeed.push({
        id: '6',
        name: 'Speaking Club',
        studentsCount: 4,
        teacherName: 'Nour Ahmad',
        schedule: 'Thu - 17:00',
        nextLesson: 'Thursday, 17:00',
        progress: 40,
      });
    }

    const groupData: Prisma.GroupCreateManyInput[] = groupsToSeed.map((g, i) => {
      const id = `group_${String(i + 1).padStart(3, '0')}`;
      groupIds[g.name] = id;
      const roomName = groupToRoom[g.name] ?? mockRooms[0]?.name ?? 'Room 101';
      const roomId = roomIds[roomName] ?? roomIds['Room 101'];
      const teacherId = teacherIds[g.teacherName];
      if (!teacherId) throw new Error(`Unknown teacher: ${g.teacherName}`);
      return {
        id,
        tenantId: DEFAULT_TENANT_ID,
        name: g.name,
        teacherId,
        roomId: roomId ?? null,
        studentIds: [],
        scheduleRule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '10:30', roomId } as any,
        color: '#F5A623',
      };
    });
    await prisma.group.createMany({ data: groupData });
    console.log(`[ClassHub] Created ${groupData.length} groups`);

    // ============================================
    // 8. SEED STUDENTS
    // ============================================
    console.log('[ClassHub] Seeding students...');
    const studentData: Prisma.StudentCreateManyInput[] = mockStudents.map((s, i) => {
      const id = `student_${String(i + 1).padStart(3, '0')}`;
      studentIds[s.name] = id;
      const groupIdsForStudent = (s.groups ?? [])
        .map((gName) => groupIds[gName])
        .filter(Boolean);
      return {
        id,
        tenantId: DEFAULT_TENANT_ID,
        fullName: s.name,
        email: s.email,
        phone: s.phone ?? null,
        status: (s.status === 'at-risk' ? 'at_risk' : s.status) as 'active' | 'at_risk' | 'inactive',
        groupIds: groupIdsForStudent,
        attendancePercent: s.attendancePercent,
        balance: s.balance,
        plan: s.plan,
        enrolledDate: s.enrolledDate ? new Date(s.enrolledDate) : new Date(),
      };
    });
    await prisma.student.createMany({ data: studentData });
    console.log(`[ClassHub] Created ${studentData.length} students`);

    // Update groups with studentIds
    for (const g of groupsToSeed) {
      const gid = groupIds[g.name];
      if (!gid) continue;
      const sids = (mockStudents ?? [])
        .filter((s) => (s.groups ?? []).includes(g.name))
        .map((s) => studentIds[s.name])
        .filter(Boolean);
      if (sids.length > 0) {
        await prisma.group.update({
          where: { id: gid },
          data: { studentIds: sids },
        });
      }
    }

    // ============================================
    // 9. SEED LESSONS
    // ============================================
    console.log('[ClassHub] Seeding lessons...');
    const lessonsData: Prisma.LessonCreateManyInput[] = mockLessons.map((l, i) => {
      const [h, m] = l.time.split(':').map(Number);
      const durationMin = parseDuration(l.duration);
      const startAt = todayAt(h, m);
      const endAt = new Date(startAt.getTime() + durationMin * 60 * 1000);
      const teacherId = teacherIds[l.teacher];
      const roomId = roomIds[l.room];
      const groupName = l.group;
      const groupId = groupIds[groupName] ?? groupIds['Arabic Beginners A1'];
      if (!teacherId) throw new Error(`Unknown teacher: ${l.teacher}`);
      const status = l.status === 'in-progress' ? 'in_progress' : l.status === 'completed' ? 'completed' : 'upcoming';
      return {
        id: `lesson_${String(i + 1).padStart(3, '0')}`,
        tenantId: DEFAULT_TENANT_ID,
        title: l.title,
        startAt,
        endAt,
        type: 'group' as const,
        groupId: groupId ?? null,
        teacherId,
        roomId: roomId ?? null,
        status,
      };
    });
    await prisma.lesson.createMany({ data: lessonsData });
    console.log(`[ClassHub] Created ${lessonsData.length} lessons`);

    // Map approval requester names to IDs
    const requesterToId = (name: string): string =>
      teacherIds[name] ?? studentIds[name] ?? teacherIds['Ahmed Hassan'];

    const approvalTypeMap: Record<string, 'teacher_change' | 'student_request' | 'room_change'> = {
      'teacher-change': 'teacher_change',
      'student-request': 'student_request',
      'room-change': 'room_change',
    };

    // ============================================
    // 10. SEED APPROVALS
    // ============================================
    console.log('[ClassHub] Seeding approvals...');
    const approvalData: Prisma.ApprovalCreateManyInput[] = mockApprovals.map((a, i) => ({
      id: `approval_${String(i + 1).padStart(3, '0')}`,
      tenantId: DEFAULT_TENANT_ID,
      type: approvalTypeMap[a.type] ?? 'teacher_change',
      title: a.title,
      description: a.description,
      payload: {} as any,
      status: a.status as 'pending' | 'approved' | 'rejected',
      priority: a.priority as 'low' | 'medium' | 'high',
      requesterId: requesterToId(a.requester),
      requesterName: a.requester,
    }));
    await prisma.approval.createMany({ data: approvalData });
    console.log(`[ClassHub] Created ${approvalData.length} approvals`);

    // ============================================
    // SEED SUMMARY
    // ============================================
    console.log('[ClassHub] ✓ Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  • ${DEFAULT_PLANS.length} pricing plans`);
    console.log(`  • 1 tenant (Demo School)`);
    console.log(`  • 1 super admin user`);
    console.log(`  • 3 workspace users`);
    console.log(`  • ${teacherData.length} teachers`);
    console.log(`  • ${roomData.length} rooms`);
    console.log(`  • ${groupData.length} groups`);
    console.log(`  • ${studentData.length} students`);
    console.log(`  • ${lessonsData.length} lessons`);
    console.log(`  • ${approvalData.length} approvals`);
    console.log('');
    console.log('🔗 Access your tenant at:');
    console.log(`  • Local: http://localhost:3000`);
    console.log(`  • Subdomain: http://${DEFAULT_TENANT_SUBDOMAIN}.localhost:3000`);
  } catch (error) {
    console.error('[ClassHub] Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[ClassHub] Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[ClassHub] Seed failed:', error);
      process.exit(1);
    });
}
