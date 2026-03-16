import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const orgs = await prisma.organization.findMany();
    console.log(`Found ${orgs.length} organizations`);
    orgs.forEach(o => console.log(`- ${o.id}: ${o.name}`));
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`Found ${users.length} users`);
    users.forEach(u => console.log(`- ${u.email}: ${u.role}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
