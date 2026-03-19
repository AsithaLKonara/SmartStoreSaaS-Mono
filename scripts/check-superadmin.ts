import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'superadmin@smartstore.com' },
    select: { email: true, role: true, organizationId: true }
  });
  console.log('SuperAdmin:', JSON.stringify(user, null, 2));
}
check().catch(console.error).finally(() => prisma.$disconnect());
