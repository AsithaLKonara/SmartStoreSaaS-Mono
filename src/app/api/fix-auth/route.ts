export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing authentication...');

    // Step 1: Set password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Hashed password:', hashedPassword.substring(0, 20) + '...');

    // Update password using raw query
    const updateResult = await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@smartstore.com'
    `;
    console.log('Update result:', updateResult);

    // Step 2: Verify the password was set
    const passwordCheck = await prisma.$queryRaw`
      SELECT password
      FROM users 
      WHERE email = 'admin@smartstore.com'
      LIMIT 1
    ` as any[];

    console.log('Password check result:', passwordCheck.length);

    if (passwordCheck.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found in database',
      });
    }

    // Step 3: Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', passwordCheck[0].password);
    console.log('Password verification:', isPasswordValid);

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
    console.error('❌ Fix auth error:', error);
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
