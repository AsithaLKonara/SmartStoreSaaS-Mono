export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    logger.info({
      message: 'Fixing authentication',
      context: { operation: 'fix-auth' }
    });

    // Step 1: Set password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    logger.debug({
      message: 'Password hashed',
      context: { operation: 'fix-auth', hashPrefix: hashedPassword.substring(0, 20) + '...' }
    });

    // Update password using raw query
    const updateResult = await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@smartstore.com'
    `;
    logger.debug({
      message: 'Password update result',
      context: { operation: 'fix-auth', updateResult }
    });

    // Step 2: Verify the password was set
    const passwordCheck = await prisma.$queryRaw`
      SELECT password
      FROM users 
      WHERE email = 'admin@smartstore.com'
      LIMIT 1
    ` as any[];

    logger.debug({
      message: 'Password check result',
      context: { operation: 'fix-auth', passwordCheckLength: passwordCheck.length }
    });

    if (passwordCheck.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found in database',
      });
    }

    // Step 3: Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', passwordCheck[0].password);
    logger.debug({
      message: 'Password verification result',
      context: { operation: 'fix-auth', isPasswordValid }
    });

    return NextResponse.json({
      success: true,
      message: 'Authentication fixed successfully',
      data: {
        email: 'admin@smartstore.com',
        password: 'admin123',
        updateResult,
        passwordSet: passwordCheck.length > 0,
        passwordValid: isPasswordValid,
      },
    });

  } catch (error) {
    logger.error({
      message: 'Fix auth error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { operation: 'fix-auth' }
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix authentication',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
