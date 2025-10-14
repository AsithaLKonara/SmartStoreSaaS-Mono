/**
 * Readiness Check (Alternative) API Route
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

export const GET = withErrorHandlerApp(
  async (req: NextRequest) => {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      return NextResponse.json(successResponse({
        ready: true,
        checks: {
          database: 'ok'
        },
        timestamp: new Date().toISOString()
      }));
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        ready: false,
        checks: {
          database: 'fail'
        },
        error: error.message
      }, { status: 503 });
    }
  }
);
