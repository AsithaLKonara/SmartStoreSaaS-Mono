/**
 * Set Password API Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * 
 * Allows users to set/change their password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current password and new password are required');
      }

      if (newPassword.length < 8) {
        throw new ValidationError('Password must be at least 8 characters');
      }

      // TODO: Verify current password and hash new password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: newPassword // Should be hashed
        }
      });

      logger.info({
        message: 'Password changed',
        context: { userId: user.id }
      });

      return NextResponse.json(successResponse({
        message: 'Password updated successfully'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Password change failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

