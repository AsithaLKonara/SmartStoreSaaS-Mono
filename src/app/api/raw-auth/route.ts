export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Testing raw authentication...');

    const body = await request.json();
    const { email, password } = body;

    // Use raw query to find user
    const users = await prisma.$queryRaw`
      SELECT id, email, name, role, password, "isActive", "organizationId"
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    ` as any[];

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        debug: { email, usersFound: users?.length || 0 },
      });
    }

    const user = users[0];

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    if (!user.password) {
      // Set a password for testing
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.$executeRaw`
        UPDATE users 
        SET password = ${hashedPassword}
        WHERE id = ${user.id}
      `;
      
      return NextResponse.json({
        success: false,
        message: 'Password was not set. Please try again with password: admin123',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid password',
      });
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
    console.error('❌ Raw auth error:', error);
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
