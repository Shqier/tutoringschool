const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seedAdmin() {
  const email = 'admin@busala.com';
  const password = 'Admin123!';

  try {
    // Check if admin exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // Update with password
      await prisma.user.update({
        where: { email },
        data: {
          hashedPassword: await hashPassword(password),
          role: 'admin',
        },
      });
      console.log('✅ Admin user updated with password');
    } else {
      // Create new admin
      await prisma.user.create({
        data: {
          email,
          name: 'Admin User',
          hashedPassword: await hashPassword(password),
          role: 'admin',
          orgId: 'default',
        },
      });
      console.log('✅ Admin user created');
    }

    console.log('');
    console.log('Login credentials:');
    console.log('  Email: admin@busala.com');
    console.log('  Password: Admin123!');
    console.log('');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
