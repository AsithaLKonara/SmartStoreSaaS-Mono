import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError, NotFoundError } from '@/lib/middleware/withErrorHandler';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reset-admin-password
 * Reset admin password (SUPER_ADMIN only)
 */
export const POST = requireRole('SUPER_ADMIN')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { userId, newPassword } = body;

      // Validate required fields
      if (!userId || !newPassword) {
        throw new ValidationError('User ID and new password are required', {
          fields: { userId: !userId, newPassword: !newPassword }
        });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long', {
          fields: { newPassword: newPassword.length < 8 }
        });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        throw new NotFoundError('User not found');
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
          resetBy: user.id,
          targetUserId: userId,
          targetUserEmail: targetUser.email
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Admin password reset successfully'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to reset admin password',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to reset admin password',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);