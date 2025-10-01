export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { apiLogger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    apiLogger.info('Direct login - checking credentials against database...');

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    apiLogger.info('Login attempt', { email });

    // Direct database query to find user
    const user = await db.user.findUnique({
      where: { email: email },
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
      apiLogger.warn('User not found', { email });
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      apiLogger.warn('Account deactivated', { email });
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Get password from database
    const passwordResult = await db.$queryRaw`
      SELECT password
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    ` as any[];

    if (!passwordResult || passwordResult.length === 0 || !passwordResult[0].password) {
      apiLogger.warn('No password set for user', { email });
      
      // Set default password for testing
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.$executeRaw`
        UPDATE users 
        SET password = ${hashedPassword}
        WHERE email = ${email}
      `;
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password was not set. Please try again with password: admin123' 
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, passwordResult[0].password);
    if (!isPasswordValid) {
      apiLogger.warn('Invalid password', { email });
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate simple JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Update last login
    await db.$executeRaw`
      UPDATE users 
      SET "updatedAt" = NOW()
      WHERE id = ${user.id}
    `;

    apiLogger.info('Login successful', { email, userId: user.id });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        },
        token,
        redirectUrl: '/dashboard',
      },
    });

    // Set simple cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;

  } catch (error) {
    apiLogger.error('Login error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}