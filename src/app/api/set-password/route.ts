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
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/set-password
 * Change user password (authenticated users)
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const body = await req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current password and new password are required', {
          fields: { currentPassword: !currentPassword, newPassword: !newPassword }
        });
      }

      if (newPassword.length < 8) {
        throw new ValidationError('Password must be at least 8 characters', {
          fields: { newPassword: newPassword.length < 8 }
        });
      }

      // Get user with password for verification
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true }
      });

      if (!userWithPassword || !userWithPassword.password) {
        throw new ValidationError('User not found or password not set');
      }

      // TODO: Verify current password
      // const isPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
      // if (!isPasswordValid) {
      //   throw new ValidationError('Current password is incorrect');
      // }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword
        }
      });

      logger.info({
        message: 'Password changed',
        context: {
          userId: user.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Password updated successfully'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Password change failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Password change failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

