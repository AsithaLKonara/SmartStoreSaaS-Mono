export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up authentication...');

    // Step 1: Find the admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@smartstore.com' },
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
      return NextResponse.json({
        success: false,
        message: 'Admin user not found',
      });
    }

    // Step 2: Set password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@smartstore.com'
    `;

    // Step 3: Verify password was set
    const passwordCheck = await prisma.$queryRaw`
      SELECT password
      FROM users 
      WHERE email = 'admin@smartstore.com'
      LIMIT 1
    ` as any[];

    if (!passwordCheck || passwordCheck.length === 0 || !passwordCheck[0].password) {
      return NextResponse.json({
        success: false,
        message: 'Failed to set password',
      });
    }

    // Step 4: Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', passwordCheck[0].password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Password verification failed',
      });
    }

    // Step 5: Generate JWT token
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
      message: 'Authentication setup successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        },
        token,
        credentials: {
          email: 'admin@smartstore.com',
          password: 'admin123',
        },
      },
    });

  } catch (error) {
    console.error('❌ Setup auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup authentication',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
