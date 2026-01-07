export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info({
      message: 'Comprehensive authentication test',
      context: { operation: 'comprehensive-auth' }
    });

    const body = await request.json();
    const { email, password } = body;

    logger.debug({
      message: 'Looking for user',
      context: { operation: 'comprehensive-auth', email }
    });

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

    logger.debug({
      message: 'User lookup result',
      context: { 
        operation: 'comprehensive-auth', 
        userFound: !!user,
        isActive: user?.isActive,
        hasPassword: !!user?.password,
        email
      }
    });

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
    logger.debug({
      message: 'Verifying password',
      context: { operation: 'comprehensive-auth', email }
    });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    logger.debug({
      message: 'Password verification result',
      context: { operation: 'comprehensive-auth', isPasswordValid, email }
    });

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
    logger.debug({
      message: 'Generating JWT token',
      context: { operation: 'comprehensive-auth', email, userId: user.id }
    });
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

    logger.info({
      message: 'Token generated successfully',
      context: { operation: 'comprehensive-auth', email, userId: user.id }
    });

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
    logger.error({
      message: 'Comprehensive auth error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { operation: 'comprehensive-auth' }
    });
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
