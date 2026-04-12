// ============================================
// BUSALA PRISMA SEED SCRIPT
// ============================================
// Run with: npx prisma db seed
// Idempotent: safe to run multiple times
//
// Admin credentials:
//   email: admin@busala.com
//   password: admin123
//
// Password hashing: Node.js crypto.scrypt
// (bcrypt-compatible security, no extra deps)

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

dotenv.config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_ORG_ID = 'org_busala_default';

function isoDate(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('[Seed] Starting Busala database seed...');

  // ============================================
  // PAYMENT PLANS (idempotent via upsert)
  // ============================================
  const planDefs = [
    { id: 'plan_001', name: 'Group 8 - Elementary',  tier: 'elementary'  as const, type: 'subscription'  as const, lessonsPerMonth: 8,  monthlyPrice: 550,  lessonPrice: null, duration: 60 },
    { id: 'plan_002', name: 'Group 12 - Elementary', tier: 'elementary'  as const, type: 'subscription'  as const, lessonsPerMonth: 12, monthlyPrice: 850,  lessonPrice: null, duration: 60 },
    { id: 'plan_003', name: 'Private - Elementary',  tier: 'elementary'  as const, type: 'pay_as_you_go' as const, lessonsPerMonth: null, monthlyPrice: null, lessonPrice: 100, duration: 60 },
    { id: 'plan_004', name: 'Group 8 - High School', tier: 'high_school' as const, type: 'subscription'  as const, lessonsPerMonth: 8,  monthlyPrice: 750,  lessonPrice: null, duration: 60 },
    { id: 'plan_005', name: 'Group 12 - High School',tier: 'high_school' as const, type: 'subscription'  as const, lessonsPerMonth: 12, monthlyPrice: 950,  lessonPrice: null, duration: 60 },
    { id: 'plan_006', name: 'Private - High School', tier: 'high_school' as const, type: 'pay_as_you_go' as const, lessonsPerMonth: null, monthlyPrice: null, lessonPrice: 120, duration: 60 },
  ];

  for (const plan of planDefs) {
    await prisma.paymentPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: { ...plan, orgId: DEFAULT_ORG_ID },
    });
  }
  console.log('[Seed] Payment plans ready');

  // ============================================
  // USERS (admin + manager with hashed passwords)
  // ============================================
  const adminHash = await hashPassword('admin123');
  const managerHash = await hashPassword('manager123');

  const userDefs = [
    { id: 'user_001', email: 'admin@busala.com',   name: 'Sarah Admin',   role: 'admin'   as const, hashedPassword: adminHash },
    { id: 'user_002', email: 'manager@busala.com', name: 'Mike Manager',  role: 'manager' as const, hashedPassword: managerHash },
    { id: 'user_003', email: 'staff@busala.com',   name: 'Dana Staff',    role: 'staff'   as const, hashedPassword: await hashPassword('staff123') },
  ];

  for (const u of userDefs) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, orgId: DEFAULT_ORG_ID },
    });
  }
  console.log('[Seed] Users ready (admin@busala.com / admin123)');

  // ============================================
  // TEACHERS
  // ============================================
  const teacherDefs = [
    {
      id: 'teacher_001', fullName: 'Ahmed Hassan', email: 'ahmed.hassan@busala.com',
      phone: '+1 234 567 8901', subjects: ['Arabic Language', 'Arabic Grammar'],
      status: 'active' as const, hoursThisWeek: 18, maxHours: 25,
      weeklyAvailability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      ],
    },
    {
      id: 'teacher_002', fullName: 'Fatima Ali', email: 'fatima.ali@busala.com',
      phone: '+1 234 567 8902', subjects: ['Arabic Grammar', 'Arabic Literature'],
      status: 'active' as const, hoursThisWeek: 22, maxHours: 25,
      weeklyAvailability: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      ],
    },
    {
      id: 'teacher_003', fullName: 'Omar Khalid', email: 'omar.khalid@busala.com',
      phone: '+1 234 567 8903', subjects: ['Quran Studies', 'Tajweed'],
      status: 'active' as const, hoursThisWeek: 15, maxHours: 20,
      weeklyAvailability: [0,1,2,3,4,5,6].map(d => ({ dayOfWeek: d, startTime: '12:00', endTime: '20:00' })),
    },
    {
      id: 'teacher_004', fullName: 'Layla Mahmoud', email: 'layla.mahmoud@busala.com',
      phone: '+1 234 567 8904', subjects: ['Advanced Arabic', 'Arabic Conversation'],
      status: 'active' as const, hoursThisWeek: 12, maxHours: 20,
      weeklyAvailability: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
      ],
    },
    {
      id: 'teacher_005', fullName: 'Yusuf Ibrahim', email: 'yusuf.ibrahim@busala.com',
      phone: '+1 234 567 8905', subjects: ['Islamic Studies', 'Arabic History'],
      status: 'inactive' as const, hoursThisWeek: 8, maxHours: 15,
      weeklyAvailability: [
        { dayOfWeek: 6, startTime: '15:00', endTime: '19:00' },
        { dayOfWeek: 0, startTime: '15:00', endTime: '19:00' },
      ],
    },
  ];

  for (const t of teacherDefs) {
    await prisma.teacher.upsert({
      where: { email_orgId: { email: t.email, orgId: DEFAULT_ORG_ID } },
      update: {},
      create: { ...t, weeklyAvailability: t.weeklyAvailability as any, orgId: DEFAULT_ORG_ID },
    });
  }
  console.log('[Seed] Teachers ready');

  // ============================================
  // ROOMS
  // ============================================
  const roomDefs = [
    { id: 'room_001', name: 'Room 101', capacity: 15, status: 'available' as const, floor: 'Ground Floor', equipment: ['Whiteboard','Projector','AC'] },
    { id: 'room_002', name: 'Room 102', capacity: 10, status: 'available' as const, floor: 'Ground Floor', equipment: ['Whiteboard','AC'] },
    { id: 'room_003', name: 'Room 105', capacity: 8,  status: 'available' as const, floor: 'Ground Floor', equipment: ['Whiteboard','Audio System','AC'] },
    { id: 'room_004', name: 'Room 201', capacity: 20, status: 'available' as const, floor: '1st Floor',    equipment: ['Whiteboard','Projector','AC','Video Conferencing'] },
    { id: 'room_005', name: 'Room 203', capacity: 12, status: 'available' as const, floor: '1st Floor',    equipment: ['Whiteboard','Projector','AC'] },
    { id: 'room_006', name: 'Room 301', capacity: 6,  status: 'maintenance' as const, floor: '2nd Floor',  equipment: ['Whiteboard','AC'] },
  ];

  for (const r of roomDefs) {
    await prisma.room.upsert({
      where: { name_orgId: { name: r.name, orgId: DEFAULT_ORG_ID } },
      update: {},
      create: { ...r, orgId: DEFAULT_ORG_ID },
    });
  }
  console.log('[Seed] Rooms ready');

  // ============================================
  // STUDENTS (20)
  // ============================================
  const studentNames = [
    'Mohammed Al-Rashid', 'Sara Abdullah',   'Ahmad Nasser',   'Fatima Hassan',
    'Youssef Karim',      'Layla Omar',       'Hassan Ibrahim', 'Mariam Saleh',
    'Ali Mansour',        'Noor Khalil',      'Khalid Faisal',  'Aisha Bakri',
    'Omar Youssef',       'Hana Mahmoud',     'Tariq Ammar',    'Leila Nabil',
    'Rami Saeed',         'Dina Farouk',      'Sami Hadid',     'Yasmin Taha',
  ];

  const groupAssignments: Record<string, string[]> = {
    group_001: ['student_001','student_004','student_009','student_013'],
    group_002: ['student_002','student_006','student_010','student_014'],
    group_003: ['student_002','student_005','student_011','student_015'],
    group_004: ['student_003','student_007','student_012'],
    group_005: ['student_004','student_008','student_016','student_017','student_018'],
    group_006: ['student_007','student_010','student_019','student_020'],
  };

  const planCycle = ['plan_001','plan_002','plan_003','plan_004','plan_005','plan_006'];
  const statusCycle: Array<'active'|'at_risk'|'inactive'> = ['active','active','active','at_risk','inactive'];
  const paymentCycle: Array<'active'|'overdue'|'active'|'active'|'active'> = ['active','overdue','active','active','active'];

  for (let i = 0; i < studentNames.length; i++) {
    const id = `student_${String(i + 1).padStart(3, '0')}`;
    const name = studentNames[i];
    const firstName = name.split(' ')[0].toLowerCase();
    const groupIds = Object.entries(groupAssignments)
      .filter(([, ids]) => ids.includes(id))
      .map(([gid]) => gid);

    await prisma.student.upsert({
      where: { email_orgId: { email: `${firstName}@example.com`, orgId: DEFAULT_ORG_ID } },
      update: {},
      create: {
        id,
        fullName: name,
        email: `${firstName}@example.com`,
        phone: `+1 234 567 ${1000 + i}`,
        status: statusCycle[i % statusCycle.length],
        grade: 1 + (i % 12),
        planId: planCycle[i % planCycle.length],
        paymentStatus: paymentCycle[i % paymentCycle.length] as any,
        groupIds,
        attendancePercent: 65 + (i * 3 % 30),
        orgId: DEFAULT_ORG_ID,
      },
    });
  }
  console.log('[Seed] Students ready');

  // ============================================
  // GROUPS
  // ============================================
  const groupDefs = [
    {
      id: 'group_001', name: 'Arabic Beginners A1', teacherId: 'teacher_001', roomId: 'room_001',
      studentIds: ['student_001','student_004','student_009','student_013'], color: '#F5A623',
      scheduleRule: { daysOfWeek: [1,3,5], startTime: '09:00', endTime: '10:30', roomId: 'room_001' },
    },
    {
      id: 'group_002', name: 'Arabic Intermediate B1', teacherId: 'teacher_002', roomId: 'room_005',
      studentIds: ['student_002','student_006','student_010','student_014'], color: '#3B82F6',
      scheduleRule: { daysOfWeek: [2,4], startTime: '10:30', endTime: '12:00', roomId: 'room_005' },
    },
    {
      id: 'group_003', name: 'Quran Memorization', teacherId: 'teacher_003', roomId: 'room_003',
      studentIds: ['student_002','student_005','student_011','student_015'], color: '#8B5CF6',
      scheduleRule: { daysOfWeek: [0,1,2,3,4,5,6], startTime: '12:00', endTime: '13:00', roomId: 'room_003' },
    },
    {
      id: 'group_004', name: 'Arabic Advanced C1', teacherId: 'teacher_004', roomId: 'room_006',
      studentIds: ['student_003','student_007','student_012'], color: '#10B981',
      scheduleRule: { daysOfWeek: [1,3], startTime: '14:00', endTime: '15:30', roomId: 'room_006' },
    },
    {
      id: 'group_005', name: 'Islamic Studies', teacherId: 'teacher_005', roomId: 'room_002',
      studentIds: ['student_004','student_008','student_016','student_017','student_018'], color: '#EC4899',
      scheduleRule: { daysOfWeek: [6,0], startTime: '15:30', endTime: '17:00', roomId: 'room_002' },
    },
    {
      id: 'group_006', name: 'Arabic Conversation Club', teacherId: 'teacher_004', roomId: 'room_004',
      studentIds: ['student_007','student_010','student_019','student_020'], color: '#F59E0B',
      scheduleRule: { daysOfWeek: [4], startTime: '17:00', endTime: '18:00', roomId: 'room_004' },
    },
  ];

  for (const g of groupDefs) {
    await prisma.group.upsert({
      where: { name_orgId: { name: g.name, orgId: DEFAULT_ORG_ID } },
      update: {},
      create: {
        id: g.id, name: g.name, teacherId: g.teacherId, roomId: g.roomId,
        studentIds: g.studentIds, color: g.color,
        scheduleRule: g.scheduleRule as any,
        orgId: DEFAULT_ORG_ID,
      },
    });
  }
  console.log('[Seed] Groups ready');

  // ============================================
  // LESSONS (past 7 days + next 7 days)
  // ============================================
  const existingLessonCount = await prisma.lesson.count({ where: { orgId: DEFAULT_ORG_ID } });
  if (existingLessonCount === 0) {
    const lessonsToCreate: Array<{
      id: string; title: string; startAt: Date; endAt: Date;
      type: 'group'|'one_on_one'; groupId?: string; studentId?: string;
      teacherId: string; roomId: string; status: 'upcoming'|'in_progress'|'completed'|'cancelled';
      orgId: string;
    }> = [];

    const now = new Date();
    let lessonCounter = 1;

    // Generate for past 7 days + next 7 days
    for (let dayOffset = -7; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dayOfWeek = date.getDay();

      for (const g of groupDefs) {
        const rule = g.scheduleRule;
        if (!rule.daysOfWeek.includes(dayOfWeek)) continue;

        const [sh, sm] = rule.startTime.split(':').map(Number);
        const [eh, em] = rule.endTime.split(':').map(Number);
        const startAt = new Date(date); startAt.setHours(sh, sm, 0, 0);
        const endAt   = new Date(date); endAt.setHours(eh, em, 0, 0);

        let status: 'upcoming'|'in_progress'|'completed'|'cancelled' = 'upcoming';
        if (endAt < now) status = 'completed';
        else if (startAt <= now) status = 'in_progress';

        lessonsToCreate.push({
          id: `lesson_${String(lessonCounter++).padStart(3, '0')}`,
          title: g.name, startAt, endAt, type: 'group',
          groupId: g.id, teacherId: g.teacherId, roomId: rule.roomId,
          status, orgId: DEFAULT_ORG_ID,
        });
      }
    }

    // 1:1 lessons
    lessonsToCreate.push(
      {
        id: 'lesson_1on1_001', title: 'Private Tutoring - Mohammed',
        startAt: isoDate(1, 16), endAt: isoDate(1, 17),
        type: 'one_on_one', studentId: 'student_001', teacherId: 'teacher_001',
        roomId: 'room_002', status: 'upcoming', orgId: DEFAULT_ORG_ID,
      },
      {
        id: 'lesson_1on1_002', title: 'Private Tutoring - Sara',
        startAt: isoDate(2, 14), endAt: isoDate(2, 15),
        type: 'one_on_one', studentId: 'student_002', teacherId: 'teacher_002',
        roomId: 'room_002', status: 'upcoming', orgId: DEFAULT_ORG_ID,
      }
    );

    await prisma.lesson.createMany({ data: lessonsToCreate });
    console.log(`[Seed] Lessons ready (${lessonsToCreate.length} lessons)`);

    // ============================================
    // ATTENDANCE (for completed group lessons)
    // ============================================
    const completedGroupLessons = lessonsToCreate.filter(
      l => l.status === 'completed' && l.type === 'group' && l.groupId
    );

    const attendanceRecords: Array<{
      id: string; lessonId: string; studentId: string;
      status: 'present'|'absent'|'late'|'excused';
      markedById: string; orgId: string;
    }> = [];

    let attCounter = 1;
    const attStatuses: Array<'present'|'absent'|'late'|'excused'> = ['present','present','present','late','absent','present','present','excused'];

    for (const lesson of completedGroupLessons) {
      const groupStudents = groupAssignments[lesson.groupId!] ?? [];
      for (const studentId of groupStudents) {
        attendanceRecords.push({
          id: `att_${String(attCounter++).padStart(4, '0')}`,
          lessonId: lesson.id,
          studentId,
          status: attStatuses[attCounter % attStatuses.length],
          markedById: 'user_001',
          orgId: DEFAULT_ORG_ID,
        });
      }
    }

    if (attendanceRecords.length > 0) {
      await prisma.attendance.createMany({ data: attendanceRecords, skipDuplicates: true });
      console.log(`[Seed] Attendance ready (${attendanceRecords.length} records)`);
    }
  } else {
    console.log('[Seed] Lessons already exist, skipping lesson/attendance seed');
  }

  // ============================================
  // SUBSCRIPTIONS + PAYMENTS (sample data)
  // ============================================
  const existingSubscriptions = await prisma.studentSubscription.count({ where: { orgId: DEFAULT_ORG_ID } });
  if (existingSubscriptions === 0) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Create subscriptions for the first 10 students on subscription plans
    const subscriptionStudents = [
      { studentId: 'student_001', planId: 'plan_001', billingDay: 1 },
      { studentId: 'student_002', planId: 'plan_002', billingDay: 1 },
      { studentId: 'student_004', planId: 'plan_001', billingDay: 5 },
      { studentId: 'student_005', planId: 'plan_002', billingDay: 5 },
      { studentId: 'student_006', planId: 'plan_004', billingDay: 10 },
      { studentId: 'student_007', planId: 'plan_005', billingDay: 10 },
      { studentId: 'student_008', planId: 'plan_001', billingDay: 15 },
      { studentId: 'student_009', planId: 'plan_004', billingDay: 15 },
      { studentId: 'student_010', planId: 'plan_002', billingDay: 1 },
      { studentId: 'student_013', planId: 'plan_005', billingDay: 1 },
    ];

    const planPrices: Record<string, { monthly: number; lessons: number }> = {
      plan_001: { monthly: 550,  lessons: 8  },
      plan_002: { monthly: 850,  lessons: 12 },
      plan_004: { monthly: 750,  lessons: 8  },
      plan_005: { monthly: 950,  lessons: 12 },
    };

    for (let i = 0; i < subscriptionStudents.length; i++) {
      const { studentId, planId, billingDay } = subscriptionStudents[i];
      const subId = `sub_${String(i + 1).padStart(3, '0')}`;
      const plan = planPrices[planId];

      await prisma.studentSubscription.create({
        data: {
          id: subId,
          studentId,
          planId,
          status: 'active',
          startDate: startOfMonth,
          billingDay,
          nextPaymentDate: startOfNextMonth,
          lastPaymentDate: startOfMonth,
          orgId: DEFAULT_ORG_ID,
        },
      });

      // Monthly payment (paid)
      await prisma.payment.create({
        data: {
          id: `pay_${String(i + 1).padStart(3, '0')}`,
          studentId,
          subscriptionId: subId,
          amount: plan.monthly,
          currency: 'ILS',
          type: 'subscription_monthly',
          status: 'completed',
          paymentMethod: 'bank_transfer',
          dueDate: startOfMonth,
          paidDate: startOfMonth,
          notes: `Monthly subscription - ${new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}`,
          orgId: DEFAULT_ORG_ID,
        },
      });

      // Lesson credits for current month
      await prisma.lessonCredit.create({
        data: {
          id: `credit_${String(i + 1).padStart(3, '0')}`,
          studentId,
          subscriptionId: subId,
          year: today.getFullYear(),
          month: today.getMonth() + 1,
          lessonsIncluded: plan.lessons,
          lessonsUsed: Math.floor(plan.lessons * 0.4),
          lessonsRemaining: Math.ceil(plan.lessons * 0.6),
          resetDate: startOfNextMonth,
          orgId: DEFAULT_ORG_ID,
        },
      });
    }

    // Pay-as-you-go payments for students on those plans
    const paygoStudents = [
      { studentId: 'student_003', planId: 'plan_003', amount: 100 },
      { studentId: 'student_011', planId: 'plan_006', amount: 120 },
      { studentId: 'student_012', planId: 'plan_006', amount: 120 },
    ];

    for (let i = 0; i < paygoStudents.length; i++) {
      const { studentId, amount } = paygoStudents[i];
      await prisma.payment.create({
        data: {
          id: `pay_paygo_${String(i + 1).padStart(3, '0')}`,
          studentId,
          amount,
          currency: 'ILS',
          type: 'private_lesson',
          status: i === 0 ? 'completed' : 'pending',
          paymentMethod: i === 0 ? 'cash' : undefined,
          dueDate: today,
          paidDate: i === 0 ? today : undefined,
          orgId: DEFAULT_ORG_ID,
        },
      });
    }

    console.log('[Seed] Subscriptions, payments, and lesson credits ready');
  } else {
    console.log('[Seed] Subscriptions already exist, skipping payment seed');
  }

  // ============================================
  // APPROVALS
  // ============================================
  const existingApprovals = await prisma.approval.count({ where: { orgId: DEFAULT_ORG_ID } });
  if (existingApprovals === 0) {
    await prisma.approval.createMany({
      data: [
        {
          id: 'approval_001', type: 'teacher_change', status: 'pending', priority: 'high',
          title: 'Schedule Change Request',
          description: 'Ahmed Hassan requests to change Monday lessons to Tuesday',
          payload: { currentDay: 1, requestedDay: 2, reason: 'Personal appointment on Mondays' },
          requesterId: 'teacher_001', requesterName: 'Ahmed Hassan',
          orgId: DEFAULT_ORG_ID, createdAt: isoDate(-1, 10),
        },
        {
          id: 'approval_002', type: 'student_request', status: 'pending', priority: 'medium',
          title: 'Group Transfer Request',
          description: 'Sara Abdullah wants to move from B1 to Advanced group',
          payload: { currentGroupId: 'group_002', requestedGroupId: 'group_004', reason: 'Ready for advanced level' },
          requesterId: 'student_002', requesterName: 'Sara Abdullah',
          orgId: DEFAULT_ORG_ID, createdAt: isoDate(-1, 14),
        },
        {
          id: 'approval_003', type: 'room_change', status: 'pending', priority: 'low',
          title: 'Room Booking Request',
          description: 'Request to book Conference Room for parent-teacher conference',
          payload: { roomId: 'room_004', startTime: '14:00', endTime: '17:00', purpose: 'Parent-teacher conference' },
          requesterId: 'teacher_002', requesterName: 'Fatima Ali',
          orgId: DEFAULT_ORG_ID, createdAt: isoDate(-2, 9),
        },
        {
          id: 'approval_004', type: 'teacher_change', status: 'approved', priority: 'medium',
          title: 'Additional Class Request',
          description: 'Layla Mahmoud requests to add an extra advanced session',
          payload: { proposedDay: 5, proposedTime: '14:00', duration: 90, roomId: 'room_004' },
          requesterId: 'teacher_004', requesterName: 'Layla Mahmoud',
          reviewerId: 'user_001', reviewerNote: 'Approved. Room 201 is available.',
          orgId: DEFAULT_ORG_ID, createdAt: isoDate(-5, 10), updatedAt: isoDate(-4, 9),
        },
      ],
    });
    console.log('[Seed] Approvals ready');
  }

  console.log('\n[Seed] ✓ Database seeded successfully!');
  console.log('  Admin login: admin@busala.com / admin123');
}

main()
  .catch(e => {
    console.error('[Seed] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
