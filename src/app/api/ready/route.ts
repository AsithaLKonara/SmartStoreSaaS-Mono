/**
 * Readiness Check API Route
 * 
 * Authorization:
 * - GET: Public (Kubernetes readiness probe)
 * 
 * Returns readiness status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';

export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      status: 'ready',
      ready: true,
      checks: {
        database: 'healthy',
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API /ready] Readiness check failed:', error);
    return NextResponse.json({
      success: false,
      status: 'not ready',
      ready: false,
      checks: {
        database: 'unhealthy',
        error: error.message
      }
    }, { status: 503 });
  }
};
