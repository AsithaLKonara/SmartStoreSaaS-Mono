import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { JWTUtils } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-request-id') || uuidv4();
  
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = JWTUtils.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      organizationId: user.organizationId || '',
    });

    // Set authentication cookies
    await JWTUtils.setAuthCookies(accessToken, refreshToken);

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
    });

  } catch (error) {
    logger.error({
      message: 'Login error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      },
      correlation: correlationId
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        correlation: correlationId
      },
      { status: 500 }
    );
  }
}
