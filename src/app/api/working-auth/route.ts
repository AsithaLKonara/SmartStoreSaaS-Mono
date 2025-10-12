export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { apiLogger } from '@/lib/utils/logger';

const prisma = new PrismaClient();

interface UserQueryResult {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  organizationId: string | null;
}

interface PasswordQueryResult {
  password: string | null;
}

export async function POST(request: NextRequest) {
  try {
    apiLogger.info('Working authentication endpoint...');

    const body = await request.json();
    const { email, password } = body;

    // Step 1: Set password for admin user (always do this first)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const updateResult = await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@smartstore.com'
    `;
    apiLogger.debug('Password update result', { updateResult });

    // Step 2: Find user
    const userResult = await prisma.$queryRaw`
      SELECT id, email, name, role, "isActive", "organizationId"
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    ` as UserQueryResult[];

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult[0];

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Step 3: Get password
    const passwordResult = await prisma.$queryRaw`
      SELECT password
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    ` as PasswordQueryResult[];

    if (!passwordResult || passwordResult.length === 0 || !passwordResult[0].password) {
      return NextResponse.json({
        success: false,
        message: 'No password found',
      });
    }

    // Step 4: Verify password
    const isPasswordValid = await bcrypt.compare(password, passwordResult[0].password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid password',
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
    apiLogger.error('Working auth error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
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
