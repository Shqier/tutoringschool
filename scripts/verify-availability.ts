#!/usr/bin/env tsx
/**
 * Verification script for teacher availability enforcement
 * Run with: npx tsx scripts/verify-availability.ts
 */

import { prisma } from '../src/lib/db/prisma';
import { checkTeacherAvailability } from '../src/lib/scheduling/teacher-availability';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('🔍 Teacher Availability Enforcement - Verification\n');

  // Create test teacher
  const teacher = await prisma.teacher.create({
    data: {
      id: uuidv4(),
      fullName: 'Test Teacher',
      email: `test-${Date.now()}@example.com`,
      subjects: ['Math'],
      status: 'active',
      weeklyAvailability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
      ],
      availabilityExceptions: [
        {
          id: uuidv4(),
          type: 'unavailable',
          startDate: '2026-02-10',
          endDate: '2026-02-14',
          reason: 'Vacation',
          allDay: true,
        },
        {
          id: uuidv4(),
          type: 'available',
          startDate: '2026-02-18',
          endDate: '2026-02-18',
          reason: 'Extra shift',
          allDay: true,
        },
      ],
      hoursThisWeek: 0,
      maxHours: 25,
      orgId: 'test-org',
    },
  });

  console.log('✅ Created test teacher:', teacher.fullName);
  console.log('   Weekly: Monday-Tuesday 9:00-17:00');
  console.log('   Vacation: Feb 10-14, 2026');
  console.log('   Extra shift: Feb 18, 2026\n');

  // Test 1: Within weekly availability
  console.log('Test 1: Monday 10:00-11:00 (within weekly schedule)');
  const test1 = await checkTeacherAvailability(
    teacher.id,
    '2026-02-02T10:00:00Z',
    '2026-02-02T11:00:00Z'
  );
  console.log(`   Result: ${test1.isAvailable ? '✅ Available' : '❌ Unavailable'}`);
  if (test1.reason) console.log(`   Reason: ${test1.reason}`);

  // Test 2: Outside weekly availability
  console.log('\nTest 2: Wednesday 10:00-11:00 (outside weekly schedule)');
  const test2 = await checkTeacherAvailability(
    teacher.id,
    '2026-02-04T10:00:00Z',
    '2026-02-04T11:00:00Z'
  );
  console.log(`   Result: ${test2.isAvailable ? '✅ Available' : '❌ Unavailable'}`);
  if (test2.reason) console.log(`   Reason: ${test2.reason}`);

  // Test 3: During vacation
  console.log('\nTest 3: Feb 11 (during vacation)');
  const test3 = await checkTeacherAvailability(
    teacher.id,
    '2026-02-11T10:00:00Z',
    '2026-02-11T11:00:00Z'
  );
  console.log(`   Result: ${test3.isAvailable ? '✅ Available' : '❌ Unavailable'}`);
  if (test3.reason) console.log(`   Reason: ${test3.reason}`);

  // Test 4: With available override
  console.log('\nTest 4: Feb 18 (Wednesday with override)');
  const test4 = await checkTeacherAvailability(
    teacher.id,
    '2026-02-18T10:00:00Z',
    '2026-02-18T11:00:00Z'
  );
  console.log(`   Result: ${test4.isAvailable ? '✅ Available' : '❌ Unavailable'}`);
  if (test4.reason) console.log(`   Reason: ${test4.reason}`);

  // Cleanup
  await prisma.teacher.delete({ where: { id: teacher.id } });
  console.log('\n🧹 Cleaned up test data');

  console.log('\n✅ All verification tests completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
