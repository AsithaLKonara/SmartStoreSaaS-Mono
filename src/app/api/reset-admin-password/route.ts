export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Resetting admin password...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Update the admin user's password using raw query
    const result = await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = 'admin@smartstore.com'
    `;

    console.log('Password reset result:', result);

    return NextResponse.json({
      success: true,
      message: 'Admin password reset successfully',
      data: {
        email: 'admin@smartstore.com',
        password: 'admin123',
        rowsUpdated: result,
      },
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
