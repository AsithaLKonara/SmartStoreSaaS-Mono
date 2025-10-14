/**
 * System Status API Route
 * 
 * Authorization:
 * - GET: Public (system status check)
 * 
 * Returns overall system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(
  async (req: NextRequest) => {
    try {
      const status = {
        status: 'operational',
        version: '1.2.0',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(successResponse(status));
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        status: 'degraded',
        error: error.message
      }, { status: 503 });
    }
  }
);
