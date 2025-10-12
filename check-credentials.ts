import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCredentials() {
  console.log('🔍 CHECKING AVAILABLE LOGIN CREDENTIALS');
  console.log('=========================================');
  console.log('');

  try {
    // Get all users from the database
    const users = await prisma.user.findMany({
      include: {
        organization: true
      }
    });

    console.log(`📊 Found ${users.length} users in the database:`);
    console.log('');

    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏢 Organization: ${user.organization?.name || 'N/A'}`);
      console.log(`   👑 Role: ${user.role}`);
      console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   🔐 Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Check if any users have passwords
    const usersWithPasswords = users.filter(user => user.password);
    
    if (usersWithPasswords.length === 0) {
      console.log('⚠️  NO USERS HAVE PASSWORDS SET!');
      console.log('');
      console.log('🔧 SOLUTION: You need to either:');
      console.log('1. Register new users through the app');
      console.log('2. Set passwords for existing users');
      console.log('3. Use Google OAuth (if configured)');
      console.log('');
      console.log('📱 To register a new user:');
      console.log('1. Go to: https://smartstore-saas.vercel.app/auth/signin');
      console.log('2. Click "Sign Up" or "Register"');
      console.log('3. Create a new account');
      console.log('');
    } else {
      console.log('✅ USERS WITH PASSWORDS:');
      usersWithPasswords.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name})`);
      });
      console.log('');
      console.log('⚠️  Note: Passwords are hashed in the database for security.');
      console.log('   You can either:');
      console.log('   - Register new users through the app');
      console.log('   - Set up Google OAuth');
      console.log('   - Create a password reset system');
    }

  } catch (error) {
    console.error('❌ Error checking credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCredentials();
