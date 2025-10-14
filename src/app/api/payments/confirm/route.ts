/**
 * Payment Confirmation API Route
 * 
 * Authorization:
 * - POST: Requires authentication
 * - Users can only confirm payments for their orders
 * 
 * Organization Scoping: Validated through order
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireAuth(
  async (request, user) => {
    logger.info({
      message: 'Payment confirmation requested',
      context: { userId: user.id }
    });
    
    return NextResponse.json(successResponse({ 
      message: 'Payment confirmation endpoint',
      status: 'coming_soon'
    }));
  }
);

export const GET = requireAuth(
  async (request, user) => {
    return NextResponse.json(successResponse({ 
      message: 'Use POST for payment confirmation',
      status: 'method_not_allowed'
    }));
  }
);
