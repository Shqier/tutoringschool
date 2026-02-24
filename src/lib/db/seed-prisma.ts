// ============================================
// BUSALA PRISMA SEED DATA
// ============================================
// Deterministic seed data for development using Prisma

import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export const DEFAULT_ORG_ID = 'org_busala_default';

const _now = new Date();

// Helper to create ISO date strings
function isoDate(daysFromNow: number, hour: number, minute: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// ============================================
// SEED FUNCTION
// ============================================
export async function seedDatabase(): Promise<void> {
  // Skip auto-seeding in test environment
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return;
  }

  console.log('[Busala] Starting database seed with Prisma...');

  // Check if already seeded
  const existingTeachers = await prisma.teacher.count();
  if (existingTeachers > 0) {
    console.log('[Busala] Database already seeded, skipping...');
    return;
  }

  try {
    // ============================================
    // USERS
    // ============================================
    const users = await prisma.user.createMany({
      data: [
        {
          id: 'user_001',
          email: 'sarah@busala.com',
          name: 'Sarah Admin',
          role: 'admin',
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'user_002',
          email: 'manager@busala.com',
          name: 'Mike Manager',
          role: 'manager',
          orgId: DEFAULT_ORG_ID,
        },
      ],
    });

    // ============================================
    // TEACHERS
    // ============================================
    const teachers = await prisma.teacher.createMany({
      data: [
        {
          id: 'teacher_001',
          fullName: 'Ahmed Hassan',
          email: 'ahmed.hassan@busala.com',
          phone: '+1 234 567 8901',
          subjects: ['Arabic Language', 'Arabic Grammar'],
          status: 'active',
          weeklyAvailability: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
          ],
          hoursThisWeek: 18,
          maxHours: 25,
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'teacher_002',
          fullName: 'Fatima Ali',
          email: 'fatima.ali@busala.com',
          phone: '+1 234 567 8902',
          subjects: ['Arabic Grammar', 'Arabic Literature'],
          status: 'active',
          weeklyAvailability: [
            { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
            { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
            { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
            { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
          ],
          hoursThisWeek: 22,
          maxHours: 25,
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'teacher_003',
          fullName: 'Omar Khalid',
          email: 'omar.khalid@busala.com',
          phone: '+1 234 567 8903',
          subjects: ['Quran Studies', 'Tajweed'],
          status: 'active',
          weeklyAvailability: [
            { dayOfWeek: 0, startTime: '12:00', endTime: '20:00' },
            { dayOfWeek: 1, startTime: '12:00', endTime: '20:00' },
            { dayOfWeek: 2, startTime: '12:00', endTime: '20:00' },
            { dayOfWeek: 3, startTime: '12:00', endTime: '20:00' },
            { dayOfWeek: 4, startTime: '12:00', endTime: '20:00' },
            { dayOfWeek: 5, startTime: '12:00', endTime: '20:00' },
            { dayOfWeek: 6, startTime: '12:00', endTime: '20:00' },
          ],
          hoursThisWeek: 15,
          maxHours: 20,
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'teacher_004',
          fullName: 'Layla Mahmoud',
          email: 'layla.mahmoud@busala.com',
          phone: '+1 234 567 8904',
          subjects: ['Advanced Arabic', 'Arabic Conversation'],
          status: 'active',
          weeklyAvailability: [
            { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
            { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
            { dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
          ],
          hoursThisWeek: 12,
          maxHours: 20,
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'teacher_005',
          fullName: 'Yusuf Ibrahim',
          email: 'yusuf.ibrahim@busala.com',
          phone: '+1 234 567 8905',
          subjects: ['Islamic Studies', 'Arabic History'],
          status: 'inactive',
          weeklyAvailability: [
            { dayOfWeek: 6, startTime: '15:00', endTime: '19:00' },
            { dayOfWeek: 0, startTime: '15:00', endTime: '19:00' },
          ],
          hoursThisWeek: 8,
          maxHours: 15,
          orgId: DEFAULT_ORG_ID,
        },
      ],
    });

    // ============================================
    // ROOMS
    // ============================================
    const rooms = await prisma.room.createMany({
      data: [
        {
          id: 'room_001',
          name: 'Room 101',
          capacity: 15,
          status: 'available',
          floor: 'Ground Floor',
          equipment: ['Whiteboard', 'Projector', 'AC'],
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'room_002',
          name: 'Room 102',
          capacity: 10,
          status: 'available',
          floor: 'Ground Floor',
          equipment: ['Whiteboard', 'AC'],
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'room_003',
          name: 'Room 105',
          capacity: 8,
          status: 'available',
          floor: 'Ground Floor',
          equipment: ['Whiteboard', 'Audio System', 'AC'],
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'room_004',
          name: 'Room 201',
          capacity: 20,
          status: 'available',
          floor: '1st Floor',
          equipment: ['Whiteboard', 'Projector', 'AC', 'Video Conferencing'],
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'room_005',
          name: 'Room 203',
          capacity: 12,
          status: 'available',
          floor: '1st Floor',
          equipment: ['Whiteboard', 'Projector', 'AC'],
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'room_006',
          name: 'Room 301',
          capacity: 6,
          status: 'maintenance',
          floor: '2nd Floor',
          equipment: ['Whiteboard', 'AC'],
          orgId: DEFAULT_ORG_ID,
        },
      ],
    });

    // ============================================
    // STUDENTS
    // ============================================
    const studentNames = [
      'Mohammed Al-Rashid', 'Sara Abdullah', 'Ahmad Nasser', 'Fatima Hassan',
      'Youssef Karim', 'Layla Omar', 'Hassan Ibrahim', 'Mariam Saleh',
      'Ali Mansour', 'Noor Khalil', 'Khalid Faisal', 'Aisha Bakri',
      'Omar Youssef', 'Hana Mahmoud', 'Tariq Ammar', 'Leila Nabil',
      'Rami Saeed', 'Dina Farouk', 'Sami Hadid', 'Yasmin Taha',
    ];

    const studentData: Prisma.StudentCreateManyInput[] = studentNames.map((name, index) => {
      const id = `student_${String(index + 1).padStart(3, '0')}`;
      const firstName = name.split(' ')[0].toLowerCase();
      const statuses: Array<'active' | 'at_risk' | 'inactive'> = ['active', 'active', 'active', 'at_risk', 'inactive'];
      const plans = ['Monthly Basic', 'Monthly Premium', 'Annual Premium', 'Pay-as-you-go'];

      // Assign students to groups based on seed groups
      const groupIds: string[] = [];
      const groupAssignments: Record<string, string[]> = {
        'group_001': ['student_001', 'student_004', 'student_009', 'student_013'],
        'group_002': ['student_002', 'student_006', 'student_010', 'student_014'],
        'group_003': ['student_002', 'student_005', 'student_011', 'student_015'],
        'group_004': ['student_003', 'student_007', 'student_012'],
        'group_005': ['student_004', 'student_008', 'student_016', 'student_017', 'student_018'],
        'group_006': ['student_007', 'student_010', 'student_019', 'student_020'],
      };

      Object.entries(groupAssignments).forEach(([groupId, studentIds]) => {
        if (studentIds.includes(id)) {
          groupIds.push(groupId);
        }
      });

      const enrolledDate = new Date(2024, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));

      return {
        id,
        fullName: name,
        email: `${firstName}@example.com`,
        phone: `+1 234 567 ${1000 + index}`,
        status: statuses[index % statuses.length],
        groupIds,
        attendancePercent: 60 + Math.floor(Math.random() * 40),
        balance: Math.floor(Math.random() * 500) - 50,
        plan: plans[index % plans.length],
        enrolledDate,
        orgId: DEFAULT_ORG_ID,
      };
    });

    await prisma.student.createMany({ data: studentData });

    // ============================================
    // GROUPS
    // ============================================
    const groups = await prisma.group.createMany({
      data: [
        {
          id: 'group_001',
          name: 'Arabic Beginners A1',
          teacherId: 'teacher_001',
          roomId: 'room_001',
          studentIds: ['student_001', 'student_004', 'student_009', 'student_013'],
          scheduleRule: {
            daysOfWeek: [1, 3, 5],
            startTime: '09:00',
            endTime: '10:30',
            roomId: 'room_001',
          },
          color: '#F5A623',
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'group_002',
          name: 'Arabic Intermediate B1',
          teacherId: 'teacher_002',
          roomId: 'room_005',
          studentIds: ['student_002', 'student_006', 'student_010', 'student_014'],
          scheduleRule: {
            daysOfWeek: [2, 4],
            startTime: '10:30',
            endTime: '12:00',
            roomId: 'room_005',
          },
          color: '#3B82F6',
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'group_003',
          name: 'Quran Memorization',
          teacherId: 'teacher_003',
          roomId: 'room_003',
          studentIds: ['student_002', 'student_005', 'student_011', 'student_015'],
          scheduleRule: {
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: '12:00',
            endTime: '13:00',
            roomId: 'room_003',
          },
          color: '#8B5CF6',
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'group_004',
          name: 'Arabic Advanced C1',
          teacherId: 'teacher_004',
          roomId: 'room_006',
          studentIds: ['student_003', 'student_007', 'student_012'],
          scheduleRule: {
            daysOfWeek: [1, 3],
            startTime: '14:00',
            endTime: '15:30',
            roomId: 'room_006',
          },
          color: '#10B981',
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'group_005',
          name: 'Islamic Studies',
          teacherId: 'teacher_005',
          roomId: 'room_002',
          studentIds: ['student_004', 'student_008', 'student_016', 'student_017', 'student_018'],
          scheduleRule: {
            daysOfWeek: [6, 0],
            startTime: '15:30',
            endTime: '17:00',
            roomId: 'room_002',
          },
          color: '#EC4899',
          orgId: DEFAULT_ORG_ID,
        },
        {
          id: 'group_006',
          name: 'Arabic Conversation Club',
          teacherId: 'teacher_004',
          roomId: 'room_004',
          studentIds: ['student_007', 'student_010', 'student_019', 'student_020'],
          scheduleRule: {
            daysOfWeek: [4],
            startTime: '17:00',
            endTime: '18:00',
            roomId: 'room_004',
          },
          color: '#F59E0B',
          orgId: DEFAULT_ORG_ID,
        },
      ],
    });

    // ============================================
    // LESSONS
    // ============================================
    const groupsData = [
      {
        id: 'group_001',
        name: 'Arabic Beginners A1',
        teacherId: 'teacher_001',
        scheduleRule: { daysOfWeek: [1, 3, 5], startTime: '09:00', endTime: '10:30', roomId: 'room_001' },
      },
      {
        id: 'group_002',
        name: 'Arabic Intermediate B1',
        teacherId: 'teacher_002',
        scheduleRule: { daysOfWeek: [2, 4], startTime: '10:30', endTime: '12:00', roomId: 'room_005' },
      },
      {
        id: 'group_003',
        name: 'Quran Memorization',
        teacherId: 'teacher_003',
        scheduleRule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '12:00', endTime: '13:00', roomId: 'room_003' },
      },
      {
        id: 'group_004',
        name: 'Arabic Advanced C1',
        teacherId: 'teacher_004',
        scheduleRule: { daysOfWeek: [1, 3], startTime: '14:00', endTime: '15:30', roomId: 'room_006' },
      },
      {
        id: 'group_005',
        name: 'Islamic Studies',
        teacherId: 'teacher_005',
        scheduleRule: { daysOfWeek: [6, 0], startTime: '15:30', endTime: '17:00', roomId: 'room_002' },
      },
      {
        id: 'group_006',
        name: 'Arabic Conversation Club',
        teacherId: 'teacher_004',
        scheduleRule: { daysOfWeek: [4], startTime: '17:00', endTime: '18:00', roomId: 'room_004' },
      },
    ];

    const lessonsData: Prisma.LessonCreateManyInput[] = [];

    // Generate lessons for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dayOfWeek = date.getDay();

      groupsData.forEach((group) => {
        if (group.scheduleRule?.daysOfWeek.includes(dayOfWeek)) {
          const [startHour, startMin] = group.scheduleRule.startTime.split(':').map(Number);
          const [endHour, endMin] = group.scheduleRule.endTime.split(':').map(Number);

          const startAt = new Date(date);
          startAt.setHours(startHour, startMin, 0, 0);

          const endAt = new Date(date);
          endAt.setHours(endHour, endMin, 0, 0);

          const nowTime = new Date();
          let status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled' = 'upcoming';
          if (endAt < nowTime) {
            status = 'completed';
          } else if (startAt <= nowTime && endAt >= nowTime) {
            status = 'in_progress';
          }

          lessonsData.push({
            id: `lesson_${String(lessonsData.length + 1).padStart(3, '0')}`,
            title: group.name,
            startAt,
            endAt,
            type: 'group',
            groupId: group.id,
            teacherId: group.teacherId,
            roomId: group.scheduleRule.roomId,
            status,
            orgId: DEFAULT_ORG_ID,
          });
        }
      });
    }

    // Add 1:1 lessons
    lessonsData.push(
      {
        id: 'lesson_1on1_001',
        title: 'Private Tutoring - Mohammed',
        startAt: isoDate(1, 16, 0),
        endAt: isoDate(1, 17, 0),
        type: 'one_on_one',
        studentId: 'student_001',
        teacherId: 'teacher_001',
        roomId: 'room_002',
        status: 'upcoming',
        orgId: DEFAULT_ORG_ID,
      },
      {
        id: 'lesson_1on1_002',
        title: 'Private Tutoring - Sara',
        startAt: isoDate(2, 14, 0),
        endAt: isoDate(2, 15, 0),
        type: 'one_on_one',
        studentId: 'student_002',
        teacherId: 'teacher_002',
        roomId: 'room_002',
        status: 'upcoming',
        orgId: DEFAULT_ORG_ID,
      }
    );

    await prisma.lesson.createMany({ data: lessonsData });

    // ============================================
    // APPROVALS
    // ============================================
    const approvals = await prisma.approval.createMany({
      data: [
        {
          id: 'approval_001',
          type: 'teacher_change',
          title: 'Schedule Change Request',
          description: 'Ahmed Hassan requests to change Monday lessons to Tuesday',
          payload: {
            currentDay: 1,
            requestedDay: 2,
            reason: 'Personal appointment on Mondays',
          },
          status: 'pending',
          priority: 'high',
          requesterId: 'teacher_001',
          requesterName: 'Ahmed Hassan',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-0.1, 10),
        },
        {
          id: 'approval_002',
          type: 'student_request',
          title: 'Group Transfer Request',
          description: 'Sara Abdullah wants to move from B1 to Advanced group',
          payload: {
            currentGroupId: 'group_002',
            requestedGroupId: 'group_004',
            reason: 'Ready for advanced level',
          },
          status: 'pending',
          priority: 'medium',
          requesterId: 'student_002',
          requesterName: 'Sara Abdullah',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-0.2, 14),
        },
        {
          id: 'approval_003',
          type: 'room_change',
          title: 'Room Booking Request',
          description: 'Request to book Conference Room for special event on Friday',
          payload: {
            roomId: 'room_004',
            date: isoDate(5, 0).toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '17:00',
            purpose: 'Parent-teacher conference',
          },
          status: 'pending',
          priority: 'low',
          requesterId: 'teacher_002',
          requesterName: 'Fatima Ali',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-1, 9),
        },
        {
          id: 'approval_004',
          type: 'teacher_change',
          title: 'Leave Request',
          description: 'Omar Khalid requests leave for next week (3 days)',
          payload: {
            startDate: isoDate(7, 0).toISOString().split('T')[0],
            endDate: isoDate(9, 0).toISOString().split('T')[0],
            reason: 'Family event',
            substituteTeacherId: 'teacher_001',
          },
          status: 'pending',
          priority: 'medium',
          requesterId: 'teacher_003',
          requesterName: 'Omar Khalid',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-1, 15),
        },
        {
          id: 'approval_005',
          type: 'student_request',
          title: 'Payment Plan Modification',
          description: 'Ahmad Nasser requests to switch to monthly payment plan',
          payload: {
            currentPlan: 'Pay-as-you-go',
            requestedPlan: 'Monthly Basic',
            startDate: isoDate(0, 0).toISOString().split('T')[0],
          },
          status: 'pending',
          priority: 'high',
          requesterId: 'student_003',
          requesterName: 'Ahmad Nasser',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-2, 11),
        },
        {
          id: 'approval_006',
          type: 'teacher_change',
          title: 'Additional Class Request',
          description: 'Layla Mahmoud requests to add an extra advanced session',
          payload: {
            proposedDay: 5,
            proposedTime: '14:00',
            duration: 90,
            roomId: 'room_004',
          },
          status: 'approved',
          priority: 'medium',
          requesterId: 'teacher_004',
          requesterName: 'Layla Mahmoud',
          reviewerId: 'user_001',
          reviewerNote: 'Approved. Room 201 is available.',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-5, 10),
          updatedAt: isoDate(-4, 9),
        },
        {
          id: 'approval_007',
          type: 'student_request',
          title: 'Temporary Leave Request',
          description: 'Youssef Karim requests 2-week leave for travel',
          payload: {
            startDate: isoDate(14, 0).toISOString().split('T')[0],
            endDate: isoDate(28, 0).toISOString().split('T')[0],
            reason: 'Family travel abroad',
          },
          status: 'approved',
          priority: 'low',
          requesterId: 'student_005',
          requesterName: 'Youssef Karim',
          reviewerId: 'user_002',
          reviewerNote: 'Approved. Student can make up classes upon return.',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-7, 16),
          updatedAt: isoDate(-6, 10),
        },
        {
          id: 'approval_008',
          type: 'room_change',
          title: 'Equipment Upgrade Request',
          description: 'Request for Room 102 projector installation',
          payload: {
            roomId: 'room_002',
            equipment: 'Projector',
            justification: 'Needed for multimedia lessons',
          },
          status: 'rejected',
          priority: 'low',
          requesterId: 'teacher_005',
          requesterName: 'Yusuf Ibrahim',
          reviewerId: 'user_001',
          reviewerNote: 'Budget not available this quarter. Re-submit in Q2.',
          orgId: DEFAULT_ORG_ID,
          createdAt: isoDate(-10, 14),
          updatedAt: isoDate(-8, 11),
        },
      ],
    });

    console.log('[Busala] Database seeded successfully with:');
    console.log(`  - ${users.count} users`);
    console.log(`  - ${teachers.count} teachers`);
    console.log(`  - ${studentData.length} students`);
    console.log(`  - ${rooms.count} rooms`);
    console.log(`  - ${groups.count} groups`);
    console.log(`  - ${lessonsData.length} lessons`);
    console.log(`  - ${approvals.count} approvals`);
  } catch (error) {
    console.error('[Busala] Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[Busala] Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Busala] Seed failed:', error);
      process.exit(1);
    });
}
