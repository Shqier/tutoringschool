import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pgPool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function seedAdmin() {
  const email = 'admin@busala.com';
  const password = 'Admin123!';

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { hashedPassword, role: 'admin' },
      });
      console.log('✅ Admin user updated with password');
    } else {
      await prisma.user.create({
        data: {
          email,
          name: 'Admin User',
          hashedPassword,
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
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pgPool.end();
  }
}

seedAdmin();
