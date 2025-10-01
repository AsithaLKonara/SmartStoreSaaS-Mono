export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Comprehensive authentication test...');

    const body = await request.json();
    const { email, password } = body;

    console.log('Looking for user:', email);

    // Use the shared Prisma instance
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
        organizationId: true,
        emailVerified: true,
      },
    });

    console.log('User found:', !!user);
    console.log('User active:', user?.isActive);
    console.log('User has password:', !!user?.password);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        debug: {
          email,
          userFound: false,
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Account is deactivated',
        debug: {
          userFound: true,
          isActive: false,
        },
      });
    }

    if (!user.password) {
      return NextResponse.json({
        success: false,
        message: 'No password set for user',
        debug: {
          userFound: true,
          isActive: true,
          hasPassword: false,
        },
      });
    }

    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid password',
        debug: {
          userFound: true,
          isActive: true,
          hasPassword: true,
          passwordValid: false,
        },
      });
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '15m' }
    );

    console.log('Token generated successfully');

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        },
        token,
      },
    });

  } catch (error) {
    console.error('❌ Comprehensive auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to authenticate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
