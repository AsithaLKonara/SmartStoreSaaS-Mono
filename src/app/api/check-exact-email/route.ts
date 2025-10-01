import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiLogger } from '@/lib/utils/logger';

const prisma = new PrismaClient();

interface UserQueryResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    apiLogger.info('Checking exact email addresses...');

    // Get all users with exact email details
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    });

    // Check each user's email for hidden characters
    const usersWithDetails = users.map(user => ({
      id: user.id,
      email: user.email,
      emailLength: user.email.length,
      emailBytes: Buffer.from(user.email).toString('hex'),
      name: user.name,
      role: user.role,
    }));

    // Try to find admin user with exact email
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smartstore.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Also try raw query
    const rawAdmin = await prisma.$queryRaw`
      SELECT id, email, name, role
      FROM users 
      WHERE email = 'admin@smartstore.com'
      LIMIT 1
    ` as UserQueryResult[];

    return NextResponse.json({
      success: true,
      data: {
        allUsers: usersWithDetails,
        adminUser,
        rawAdmin,
        adminUserFound: !!adminUser,
        rawAdminFound: rawAdmin.length > 0,
      },
    });

  } catch (error) {
    apiLogger.error('Check exact email error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check exact email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}