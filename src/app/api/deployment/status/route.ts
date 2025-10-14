/**
 * Deployment Status API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_DEPLOYMENT permission)
 * 
 * System-wide: Shows deployment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      logger.info({
        message: 'Deployment status fetched',
        context: { userId: user.id }
      });

      const status = {
        environment: process.env.NODE_ENV,
        version: '1.2.0',
        lastDeployment: new Date().toISOString(),
        status: 'active'
      };

      return NextResponse.json(successResponse(status));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch deployment status',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
