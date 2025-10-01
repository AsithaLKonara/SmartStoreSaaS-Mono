export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Checking password for user...');

    const body = await request.json();
    const { email } = body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.password) {
      return NextResponse.json({
        success: false,
        message: 'User has no password',
      });
    }

    // Test common passwords
    const testPasswords = ['admin123', 'password', 'admin', '123456', 'password123'];
    const results = {};

    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      results[testPassword] = isValid;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: true,
          passwordHashLength: user.password.length,
          passwordHashStart: user.password.substring(0, 15) + '...',
        },
        passwordTests: results,
      },
    });

  } catch (error) {
    console.error('❌ Check password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
