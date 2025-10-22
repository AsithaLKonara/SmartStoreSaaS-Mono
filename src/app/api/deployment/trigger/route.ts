/**
 * Deployment Trigger API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN only (MANAGE_DEPLOYMENT permission)
 * 
 * System-wide: Triggers deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      const body = await request.json();
      const { branch = 'main', environment = 'production' } = body;

      logger.info({
        message: 'Deployment triggered',
        context: {
          userId: user.id,
          branch,
          environment
        }
      });

      return NextResponse.json(successResponse({
        message: 'Deployment triggered',
        branch,
        environment,
        status: 'pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Deployment trigger failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
