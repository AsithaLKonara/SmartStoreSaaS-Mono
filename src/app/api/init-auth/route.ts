export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let prisma: PrismaClient | null = null;
  
  try {
    logger.info({
      message: 'Initializing authentication',
      context: { operation: 'init-auth' }
    });

    // Create a fresh Prisma client
    prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Find the admin user
    const userResult = await prisma.$queryRaw`
      SELECT id, email, name, role
      FROM users 
      WHERE email = 'admin@smartstore.com'
      LIMIT 1
    ` as any[];

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found',
      });
    }

    const user = userResult[0];

    // Set password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const updateResult = await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@smartstore.com'
    `;

    // Verify password was set
    const passwordCheck = await prisma.$queryRaw`
      SELECT password
      FROM users 
      WHERE email = 'admin@smartstore.com'
      LIMIT 1
    ` as any[];

    if (!passwordCheck || passwordCheck.length === 0 || !passwordCheck[0].password) {
      return NextResponse.json({
        success: false,
        message: 'Failed to set password',
      });
    }

    // Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', passwordCheck[0].password);

    return NextResponse.json({
      success: true,
      message: 'Authentication initialized successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        updateResult,
        passwordSet: passwordCheck.length > 0,
        passwordValid: isPasswordValid,
        testCredentials: {
          email: 'admin@smartstore.com',
          password: 'admin123',
        },
      },
    });

  } catch (error) {
    logger.error({
      message: 'Init auth error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { operation: 'init-auth' }
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize authentication',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    // Close the Prisma client connection
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
