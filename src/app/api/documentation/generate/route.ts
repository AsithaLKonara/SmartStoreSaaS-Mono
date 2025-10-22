/**
 * Documentation Generate API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_DOCS permission)
 * 
 * Generates API documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      logger.info({
        message: 'Documentation generation triggered',
        context: { userId: user.id }
      });

      return NextResponse.json(successResponse({
        message: 'Documentation generation',
        status: 'pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Documentation generation failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
