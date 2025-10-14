/**
 * Database Connection Check API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only
 * 
 * Quick database connectivity check
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('SUPER_ADMIN')(
  async (request, user) => {
    try {
      await prisma.$connect();
      
      logger.info({
        message: 'Database connection verified',
        context: { userId: user.id }
      });

      return NextResponse.json(successResponse({
        connected: true,
        message: 'Database connection successful'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Database connection failed',
        error: error,
        context: { userId: user.id }
      });
      
      return NextResponse.json({
        success: false,
        connected: false,
        error: error.message
      }, { status: 503 });
    }
  }
);
