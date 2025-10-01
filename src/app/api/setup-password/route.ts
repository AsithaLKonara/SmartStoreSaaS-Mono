import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Setting up password...');

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const userResult = await db.$queryRaw`
      SELECT id, email, name, role
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    ` as any[];

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult[0];

    // Set password
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateResult = await db.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = ${email}
    `;

    // Verify password was set
    const passwordCheck = await db.$queryRaw`
      SELECT password
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    ` as any[];

    if (!passwordCheck || passwordCheck.length === 0 || !passwordCheck[0].password) {
      return NextResponse.json({
        success: false,
        message: 'Failed to set password',
      });
    }

    // Test password verification
    const isPasswordValid = await bcrypt.compare(password, passwordCheck[0].password);

    return NextResponse.json({
      success: true,
      message: 'Password setup successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        updateResult,
        passwordSet: passwordCheck.length > 0,
        passwordValid: isPasswordValid,
      },
    });

  } catch (error) {
    console.error('❌ Setup password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}