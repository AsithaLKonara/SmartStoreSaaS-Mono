export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Input validation schema
const signinSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = signinSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Use the EXACT same pattern as test-users endpoint
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found' 
        }, 
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Account is deactivated' 
        }, 
        { status: 401 }
      );
    }

    // Get password separately
    const userWithPassword = await prisma.user.findUnique({
      where: { email },
      select: {
        password: true,
      },
    });

    if (!userWithPassword || !userWithPassword.password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No password set for user' 
        }, 
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid password' 
        }, 
        { status: 401 }
      );
    }

    // Generate JWT token
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

    return NextResponse.json({
      success: true,
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
      message: 'Sign in successful',
    });

  } catch (error) {
    logger.error({
      message: 'Signin error',
      error: error instanceof Error ? error : new Error(String(error)),
      context: { operation: 'working-signin' }
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}
