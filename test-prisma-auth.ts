import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuth() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@smartstore.com' },
    });
    
    if (user) {
      console.log(`✅ Authentication Layer connected! Prisma successfully resolved: ${user.email} with Role: ${user.role}`);
    } else {
      console.log(`❌ User not found!`);
    }
  } catch (error) {
    console.error("Prisma NextAuth failure:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
