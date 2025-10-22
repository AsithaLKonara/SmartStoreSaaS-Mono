import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check for SUPER_ADMIN only
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    // Validate required fields
    if (!userId || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'User ID and new password are required'
      }, { status: 400 });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    logger.info({
      message: 'Admin password reset successfully',
      context: {
        resetBy: session.user.id,
        targetUserId: userId,
        targetUserEmail: user.email
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Admin password reset successfully'
    });

  } catch (error: any) {
    logger.error({
      message: 'Failed to reset admin password',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset admin password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}