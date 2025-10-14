/**
 * Reset Admin Password API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (can reset other admin passwords)
 * 
 * System-wide: Password reset functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { userId, newPassword } = body;

      if (!userId || !newPassword) {
        throw new ValidationError('User ID and new password are required');
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        throw new ValidationError('User not found');
      }

      // TODO: Hash password before storing
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: newPassword, // Should be hashed
          passwordResetRequired: true
        }
      });

      logger.info({
        message: 'Admin password reset',
        context: {
          adminId: user.id,
          targetUserId: userId
        }
      });

      return NextResponse.json(successResponse({
        message: 'Password reset successful',
        passwordResetRequired: true
      }));
    } catch (error: any) {
      logger.error({
        message: 'Admin password reset failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
