/**
 * Documentation API Route
 * 
 * Authorization:
 * - GET: Requires authentication (all roles)
 * 
 * Provides API documentation access
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(
  async (request, user) => {
    try {
      logger.info({
        message: 'Documentation accessed',
        context: { userId: user.id }
      });

      // TODO: Return actual API documentation
      return NextResponse.json(successResponse({
        version: '1.0.0',
        endpoints: [],
        message: 'API documentation - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch documentation',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
