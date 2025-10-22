/**
 * System Status API Route
 * 
 * Authorization:
 * - GET: Public (system status check)
 * 
 * Returns overall system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandlerApp(
  async (req: NextRequest) => {
    const status = {
      status: 'operational',
      version: '1.2.1',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(successResponse(status));
  }
);
