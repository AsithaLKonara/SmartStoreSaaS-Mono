/**
 * Logout API Route
 * 
 * Authorization:
 * - POST: Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    try {
      logger.info({
        message: 'User logged out',
        context: {
          userId: user.id,
          email: user.email,
          role: user.role
        }
      });

      return NextResponse.json(successResponse({
        message: 'Logged out successfully'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Logout error',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
