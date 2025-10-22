import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestPasswords() {
  console.log('🔐 SETTING UP TEST PASSWORDS FOR DEMO USERS');
  console.log('=============================================');
  console.log('');

  try {
    // Default password for all demo users
    const defaultPassword = 'demo123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Update all users with the demo password
    const updateResult = await prisma.user.updateMany({
      where: {
        email: {
          in: [
            'admin@techhub.lk',
            'manager@colombofashion.lk', 
            'admin@freshmart.lk'
          ]
        }
      },
      data: {
        password: hashedPassword
      }
    });

    console.log(`✅ Updated ${updateResult.count} users with demo password`);
    console.log('');
    console.log('🎯 DEMO LOGIN CREDENTIALS:');
    console.log('==========================');
    console.log('');
    console.log('1. 👤 ADMIN - TechHub Electronics');
    console.log('   📧 Email: admin@techhub.lk');
    console.log('   🔑 Password: demo123');
    console.log('   👑 Role: ADMIN');
    console.log('');
    console.log('2. 👤 MANAGER - Colombo Fashion House');
    console.log('   📧 Email: manager@colombofashion.lk');
    console.log('   🔑 Password: demo123');
    console.log('   👑 Role: STAFF');
    console.log('');
    console.log('3. 👤 ADMIN - FreshMart Supermarket');
    console.log('   📧 Email: admin@freshmart.lk');
    console.log('   🔑 Password: demo123');
    console.log('   👑 Role: ADMIN');
    console.log('');
    console.log('🌐 LOGIN URL:');
    console.log('https://smartstore-saas.vercel.app/auth/signin');
    console.log('');
    console.log('🎉 You can now test the authentication system!');
    console.log('');
    console.log('💡 TIP: Use admin@techhub.lk for full admin access');

  } catch (error) {
    console.error('❌ Error setting up passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestPasswords();
