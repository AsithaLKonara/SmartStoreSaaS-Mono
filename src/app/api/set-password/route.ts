import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Setting password for user...');

    const body = await request.json();
    const { email, password } = body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
      data: {
        user: updatedUser,
        testCredentials: {
          email: email,
          password: password,
        },
      },
    });

  } catch (error) {
    console.error('❌ Set password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
