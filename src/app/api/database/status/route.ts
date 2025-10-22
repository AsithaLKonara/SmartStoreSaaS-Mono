/**
 * Database Status API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN only (VIEW_DB_STATUS permission)
 * 
 * System-wide: Database health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add role check for SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const startTime = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;

    logger.info({
      message: 'Database status checked',
      context: { userId: session.user.id, responseTime }
    });

    return NextResponse.json(successResponse({
      status: 'healthy',
      responseTime,
      connected: true,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    logger.error({
      message: 'Database status check failed',
      error: error
    });
    
    return NextResponse.json(successResponse({
      status: 'unhealthy',
      connected: false,
      error: error.message
    }), { status: 503 });
      }
    }
